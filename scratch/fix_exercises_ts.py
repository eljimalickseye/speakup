file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Remove stray closing braces at lines 2193-2194 (0-indexed: lines 2192 and 2193)
# Let's print them first to verify
print("Line 2192 (0-indexed):", repr(lines[2192]))
print("Line 2193 (0-indexed):", repr(lines[2193]))

# Let's delete them if they match "    }\n" and "  }\n"
if "}" in lines[2192] and "}" in lines[2193]:
    del lines[2193]
    del lines[2192]
    print("Stray braces deleted successfully!")
else:
    print("Error: Stray braces did not match expected contents!")

content = "".join(lines)

# 2. Replace the python boolean True with typescript boolean true
# But avoid replacing user-facing text strings
content = content.replace("showPlacementTest.set(True)", "showPlacementTest.set(true)")
content = content.replace("placementTestTaken: True", "placementTestTaken: true")
content = content.replace("updateUserXP(user.id, xp, True)", "updateUserXP(user.id, xp, true)")
content = content.replace("canRetry: True", "canRetry: true")
content = content.replace("gameFinished.set(True)", "gameFinished.set(true)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts corrections complete!")
