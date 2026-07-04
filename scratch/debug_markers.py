file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Detailed Game Results Overlay" in line:
        print(f"Found on line {i+1}: {repr(line)}")
        print("Lines before:")
        for offset in range(-5, 1):
            print(f"Line {i+1+offset}: {repr(lines[i+offset])}")
        break
