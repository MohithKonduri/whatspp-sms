with open('.env.local', 'r') as f:
    for line in f:
        if 'TWILIO' in line:
            print(f"DEBUG: {line.strip()}")
