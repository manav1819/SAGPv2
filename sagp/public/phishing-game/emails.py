import pandas as pd
import json

# Load CSV
df = pd.read_csv('emails.csv')  # adjust filename if needed

print(f"Total rows: {len(df)}")
print(f"Columns: {df.columns.tolist()}")
print(f"Label values: {df['label'].unique()}")
print(f"Null counts:\n{df.isnull().sum()}\n")

# Clean & filter
df = df[['sender', 'subject', 'body', 'label']].dropna()

# Truncate body for display
df['body'] = df['body'].str.slice(0, 200)

# Normalize label to int (handles bool/string/int variants)
df['label'] = df['label'].apply(lambda x: 1 if str(x).strip().lower() in ['1', 'true', 'phishing'] else 0)

# Sample 100 for the game (optional, remove .sample() to export all)
df_sample = df.sample(100, random_state=42).reset_index(drop=True)

# Convert to list of dicts
records = df_sample.to_dict(orient='records')

# Save
with open('emails.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, indent=2, ensure_ascii=False)

print(f"✅ Saved {len(records)} records to emails.json")
print("Sample:")
print(json.dumps(records[0], indent=2))