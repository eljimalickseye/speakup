file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 2470 (0-indexed: line 2469)
# Let's inspect line 2469
print("Line 2469 (0-indexed):", repr(lines[2469]))
print("Line 2470 (0-indexed):", repr(lines[2470]))

# Let's delete line 2469 if it is "    }\n"
if lines[2469].strip() == "}":
    del lines[2469]
    print("Stray brace deleted!")
else:
    print("Error: content of line 2469 is not '}'!")

content = "".join(lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts brace correction complete!")
