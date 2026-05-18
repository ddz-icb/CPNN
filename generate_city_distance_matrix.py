#!/usr/bin/env python3
"""
Generate an adjacency/distance matrix for the world's largest cities.

Source used by default:
  https://gist.githubusercontent.com/dikaio/0ce2a7e9f7088918f8c6ff24436fd035/raw/data.csv

Outputs:
  - cities_top500.csv: node metadata, one row per city
  - distance_matrix_km.csv: 500x500 matrix, entry (i,j) = great-circle distance in km
  - distance_matrix_miles.csv: same matrix in miles

Definition of distance:
  Great-circle distance over WGS84 mean Earth radius, using the haversine formula.
  This is geographic/air distance, not road distance.
"""

from __future__ import annotations

import argparse
import csv
import math
import re
import urllib.request
from pathlib import Path

DEFAULT_URL = "https://gist.githubusercontent.com/dikaio/0ce2a7e9f7088918f8c6ff24436fd035/raw/data.csv"
EARTH_RADIUS_KM = 6371.0088
KM_TO_MILES = 0.621371192237334


def parse_source_text(text: str) -> list[dict[str, str]]:
    """Parse either comma CSV or whitespace-separated city/lat/lng/country/population rows."""
    text = text.replace("\ufeff", "").strip()
    rows: list[dict[str, str]] = []

    # Try normal CSV first.
    sample = text.splitlines()[0] if text.splitlines() else ""
    if "," in sample:
        reader = csv.DictReader(text.splitlines())
        for row in reader:
            if not row:
                continue
            city = row.get("city") or row.get("name") or row.get("name_en")
            lat = row.get("lat") or row.get("latitude")
            lng = row.get("lng") or row.get("longitude")
            country = row.get("country") or row.get("country_name")
            population = row.get("population") or row.get("pop")
            if city and lat and lng and country and population:
                rows.append(
                    {
                        "city": city.strip(),
                        "lat": lat.strip(),
                        "lng": lng.strip(),
                        "country": country.strip(),
                        "population": population.strip(),
                    }
                )
        return rows

    # Fallback for GitHub-rendered text copied as whitespace columns:
    # city name may contain spaces; lat/lng are the first two numeric tokens before country/population.
    pattern = re.compile(r"^(.+?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(.+?)\s+(\d+)$")
    for line in text.splitlines():
        line = line.strip()
        if not line or line.lower().startswith("city "):
            continue
        match = pattern.match(line)
        if match:
            city, lat, lng, country, population = match.groups()
            rows.append({"city": city, "lat": lat, "lng": lng, "country": country, "population": population})
    return rows


def download_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "city-distance-matrix-generator/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def build_matrix(cities: list[dict[str, str]], multiplier: float = 1.0) -> list[list[float]]:
    coords = [(float(city["lat"]), float(city["lng"])) for city in cities]
    n = len(coords)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        lat1, lng1 = coords[i]
        for j in range(i + 1, n):
            lat2, lng2 = coords[j]
            distance = round(haversine_km(lat1, lng1, lat2, lng2) * multiplier, 3)
            matrix[i][j] = distance
            matrix[j][i] = distance
    return matrix


def safe_id(city: str, country: str, idx: int) -> str:
    base = re.sub(r"[^A-Za-z0-9]+", "_", f"{city}_{country}").strip("_").lower()
    return f"{idx:03d}_{base}"


def write_cities(path: Path, cities: list[dict[str, str]]) -> list[str]:
    ids = [safe_id(city["city"], city["country"], i + 1) for i, city in enumerate(cities)]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["node_index", "node_id", "city", "country", "latitude", "longitude", "population"])
        for i, (node_id, city) in enumerate(zip(ids, cities), start=1):
            writer.writerow(
                [i, node_id, city["city"], city["country"], city["lat"], city["lng"], city["population"]]
            )
    return ids


def write_matrix(path: Path, ids: list[str], matrix: list[list[float]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["node_id", *ids])
        for node_id, row in zip(ids, matrix):
            writer.writerow([node_id, *row])


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate city metadata and great-circle distance matrices.")
    parser.add_argument("--url", default=DEFAULT_URL, help="Source CSV URL")
    parser.add_argument("--input", type=Path, help="Optional local source CSV/text file instead of --url")
    parser.add_argument("--n", type=int, default=500, help="Number of largest cities to keep")
    parser.add_argument("--outdir", type=Path, default=Path("top500_city_distances"), help="Output directory")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    text = args.input.read_text(encoding="utf-8") if args.input else download_text(args.url)
    rows = parse_source_text(text)
    if len(rows) < args.n:
        raise SystemExit(f"Only parsed {len(rows)} usable rows; need at least {args.n}.")

    rows.sort(key=lambda row: int(float(row["population"])), reverse=True)
    cities = rows[: args.n]

    args.outdir.mkdir(parents=True, exist_ok=True)
    ids = write_cities(args.outdir / "cities_top500.csv", cities)
    write_matrix(args.outdir / "distance_matrix_km.csv", ids, build_matrix(cities))
    write_matrix(args.outdir / "distance_matrix_miles.csv", ids, build_matrix(cities, KM_TO_MILES))

    (args.outdir / "README.txt").write_text(
        "Top 500 city distance matrix\n"
        "============================\n\n"
        f"Rows kept: {args.n}\n"
        "Matrix definition: entry (i,j) is great-circle distance between cities i and j.\n"
        "Units: distance_matrix_km.csv is kilometers; distance_matrix_miles.csv is miles.\n"
        "Diagonal entries are 0. Matrix is symmetric.\n"
        f"Source URL: {args.url}\n",
        encoding="utf-8",
    )
    print(f"Wrote {args.n} cities and distance matrices to {args.outdir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
