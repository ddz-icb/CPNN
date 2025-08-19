import sys
import pandas as pd
import json

method = sys.argv[1]  # "pearson" or "spearman"
input_data = sys.stdin.read()

try:
    data = json.loads(input_data)

    df = pd.DataFrame(data)

    name_column = df.columns[0]
    df = df.set_index(name_column)

    df_numeric = df.apply(pd.to_numeric, errors="coerce")
    df_numeric = df_numeric.dropna(axis=0, how="all")

    corr_matrix = df_numeric.T.corr(method=method).round(2)

    print(corr_matrix.to_json(orient="split"))
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)