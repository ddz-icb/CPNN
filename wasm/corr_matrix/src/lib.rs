use std::boxed::Box;
use std::vec::Vec;
use std::slice;

#[repr(C)]
pub struct EdgeResult {
  sources_ptr: *mut u32,
  targets_ptr: *mut u32,
  weights_ptr: *mut f32,
  len: usize,
  sources_cap: usize,
  targets_cap: usize,
  weights_cap: usize,
}

#[no_mangle]
pub extern "C" fn alloc_f64(len: usize) -> *mut f64 {
  if len == 0 {
    return core::ptr::null_mut();
  }
  let mut buf: Vec<f64> = Vec::with_capacity(len);
  let ptr = buf.as_mut_ptr();
  core::mem::forget(buf);
  ptr
}

#[no_mangle]
pub extern "C" fn dealloc_f64(ptr: *mut f64, len: usize) {
  if ptr.is_null() || len == 0 {
    return;
  }
  unsafe {
    Vec::from_raw_parts(ptr, 0, len);
  }
}

fn round2(value: f64) -> f64 {
  let factor = 100.0;
  let scaled = value * factor;
  let sign = if scaled < 0.0 { -1.0 } else { 1.0 };
  let abs = scaled.abs();
  let floor = abs.floor();
  let diff = abs - floor;
  let rounded = if diff > 0.5 {
    floor + 1.0
  } else if diff < 0.5 {
    floor
  } else if (floor as u64) % 2 == 0 {
    floor
  } else {
    floor + 1.0
  };
  (rounded * sign) / factor
}

fn corr_pair(data: &[f64], cols: usize, row_i: usize, row_j: usize) -> Option<f64> {
  let base_i = row_i * cols;
  let base_j = row_j * cols;

  let mut sum_x = 0.0;
  let mut sum_y = 0.0;
  let mut sum_xx = 0.0;
  let mut sum_yy = 0.0;
  let mut sum_xy = 0.0;
  let mut n = 0.0;

  for k in 0..cols {
    let x = data[base_i + k];
    let y = data[base_j + k];

    if x.is_nan() || y.is_nan() {
      continue;
    }

    n += 1.0;
    sum_x += x;
    sum_y += y;
    sum_xx += x * x;
    sum_yy += y * y;
    sum_xy += x * y;
  }

  if n < 2.0 {
    return None;
  }

  let cov = sum_xy - (sum_x * sum_y) / n;
  let var_x = sum_xx - (sum_x * sum_x) / n;
  let var_y = sum_yy - (sum_y * sum_y) / n;

  if var_x <= 0.0 || var_y <= 0.0 {
    return None;
  }

  let corr = cov / (var_x * var_y).sqrt();
  if corr.is_nan() {
    return None;
  }

  Some(round2(corr))
}

fn pearson_from_slices(x: &[f64], y: &[f64]) -> Option<f64> {
  let n = x.len();
  if n < 2 || n != y.len() {
    return None;
  }

  let mut sum_x = 0.0;
  let mut sum_y = 0.0;
  let mut sum_xx = 0.0;
  let mut sum_yy = 0.0;
  let mut sum_xy = 0.0;

  for i in 0..n {
    let xi = x[i];
    let yi = y[i];
    sum_x += xi;
    sum_y += yi;
    sum_xx += xi * xi;
    sum_yy += yi * yi;
    sum_xy += xi * yi;
  }

  let n_f = n as f64;
  let cov = sum_xy - (sum_x * sum_y) / n_f;
  let var_x = sum_xx - (sum_x * sum_x) / n_f;
  let var_y = sum_yy - (sum_y * sum_y) / n_f;

  if var_x <= 0.0 || var_y <= 0.0 {
    return None;
  }

  let corr = cov / (var_x * var_y).sqrt();
  if corr.is_nan() {
    return None;
  }
  Some(corr)
}

fn rank_values(values: &[f64]) -> Vec<f64> {
  let n = values.len();
  let mut indices: Vec<usize> = (0..n).collect();
  indices.sort_by(|a, b| values[*a].partial_cmp(&values[*b]).unwrap());

  let mut ranks = vec![0.0; n];
  let mut i = 0;
  while i < n {
    let mut j = i;
    let value = values[indices[i]];
    while j + 1 < n && values[indices[j + 1]] == value {
      j += 1;
    }
    let rank = (i + j + 2) as f64 / 2.0;
    for k in i..=j {
      ranks[indices[k]] = rank;
    }
    i = j + 1;
  }

  ranks
}

#[no_mangle]
pub extern "C" fn pearson_edges(
  data_ptr: *const f64,
  rows: usize,
  cols: usize,
  min_corr: f64,
  take_abs: u32,
) -> *mut EdgeResult {
  if data_ptr.is_null() || rows == 0 || cols == 0 {
    return core::ptr::null_mut();
  }

  let data = unsafe { slice::from_raw_parts(data_ptr, rows * cols) };
  let mut sources: Vec<u32> = Vec::new();
  let mut targets: Vec<u32> = Vec::new();
  let mut weights: Vec<f32> = Vec::new();

  let use_abs = take_abs != 0;

  for i in 0..rows {
    for j in 0..i {
      let corr_opt = corr_pair(data, cols, i, j);
      if corr_opt.is_none() {
        continue;
      }

      let mut corr = corr_opt.unwrap();
      if use_abs {
        corr = corr.abs();
      } else if corr <= 0.0 {
        continue;
      }

      if corr < min_corr {
        continue;
      }

      sources.push(i as u32);
      targets.push(j as u32);
      weights.push(corr as f32);
    }
  }

  let result = EdgeResult {
    sources_ptr: sources.as_mut_ptr(),
    targets_ptr: targets.as_mut_ptr(),
    weights_ptr: weights.as_mut_ptr(),
    len: weights.len(),
    sources_cap: sources.capacity(),
    targets_cap: targets.capacity(),
    weights_cap: weights.capacity(),
  };

  core::mem::forget(sources);
  core::mem::forget(targets);
  core::mem::forget(weights);

  Box::into_raw(Box::new(result))
}

#[no_mangle]
pub extern "C" fn spearman_edges(
  data_ptr: *const f64,
  rows: usize,
  cols: usize,
  min_corr: f64,
  take_abs: u32,
) -> *mut EdgeResult {
  if data_ptr.is_null() || rows == 0 || cols == 0 {
    return core::ptr::null_mut();
  }

  let data = unsafe { slice::from_raw_parts(data_ptr, rows * cols) };
  let mut sources: Vec<u32> = Vec::new();
  let mut targets: Vec<u32> = Vec::new();
  let mut weights: Vec<f32> = Vec::new();

  let use_abs = take_abs != 0;

  for i in 0..rows {
    for j in 0..i {
      let mut x: Vec<f64> = Vec::new();
      let mut y: Vec<f64> = Vec::new();

      let base_i = i * cols;
      let base_j = j * cols;
      for k in 0..cols {
        let xi = data[base_i + k];
        let yi = data[base_j + k];
        if xi.is_nan() || yi.is_nan() {
          continue;
        }
        x.push(xi);
        y.push(yi);
      }

      if x.len() < 2 {
        continue;
      }

      let rank_x = rank_values(&x);
      let rank_y = rank_values(&y);
      let corr_opt = pearson_from_slices(&rank_x, &rank_y);
      if corr_opt.is_none() {
        continue;
      }

      let mut corr = round2(corr_opt.unwrap());
      if use_abs {
        corr = corr.abs();
      } else if corr <= 0.0 {
        continue;
      }

      if corr < min_corr {
        continue;
      }

      sources.push(i as u32);
      targets.push(j as u32);
      weights.push(corr as f32);
    }
  }

  let result = EdgeResult {
    sources_ptr: sources.as_mut_ptr(),
    targets_ptr: targets.as_mut_ptr(),
    weights_ptr: weights.as_mut_ptr(),
    len: weights.len(),
    sources_cap: sources.capacity(),
    targets_cap: targets.capacity(),
    weights_cap: weights.capacity(),
  };

  core::mem::forget(sources);
  core::mem::forget(targets);
  core::mem::forget(weights);

  Box::into_raw(Box::new(result))
}

#[no_mangle]
pub extern "C" fn free_edges(result_ptr: *mut EdgeResult) {
  if result_ptr.is_null() {
    return;
  }

  unsafe {
    let result = Box::from_raw(result_ptr);
    let _ = Vec::from_raw_parts(result.sources_ptr, result.len, result.sources_cap);
    let _ = Vec::from_raw_parts(result.targets_ptr, result.len, result.targets_cap);
    let _ = Vec::from_raw_parts(result.weights_ptr, result.len, result.weights_cap);
  }
}
