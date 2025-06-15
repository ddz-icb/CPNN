import sys
import pandas as pd
import json
import io

method = sys.argv[1]  # "pearson" or "spearman"
input_data = sys.stdin.read()

try:
    print("Input len:", len(input_data), file=sys.stderr)

    data = json.loads(input_data)

    df = pd.DataFrame(data).apply(pd.to_numeric, errors="coerce")

    print("DF:", df, file=sys.stderr)

    corr_matrix = df.T.corr(method=method).round(2)

    print("Correlation Matrix:", corr_matrix, file=sys.stderr)

    print(corr_matrix.to_json())
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)