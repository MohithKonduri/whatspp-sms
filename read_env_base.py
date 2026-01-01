with open('.env.local', 'r') as f:
    for line in f:
        if 'TWILIO' not in line:
            print(line.strip())
