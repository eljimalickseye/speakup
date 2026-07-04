file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

nesting = 0
in_string = False
string_char = None
in_comment_single = False
in_comment_multi = False

class_declared = False
class_start_line = -1

for idx, line in enumerate(lines):
    line_num = idx + 1
    
    # Simple token parser to skip strings and comments
    i = 0
    while i < len(line):
        char = line[i]
        
        # Handle single line comments
        if not in_string and not in_comment_multi and line[i:i+2] == '//':
            break
            
        # Handle multi-line comments
        if not in_string and not in_comment_single:
            if line[i:i+2] == '/*':
                in_comment_multi = True
                i += 2
                continue
            elif line[i:i+2] == '*/':
                in_comment_multi = False
                i += 2
                continue
                
        if in_comment_multi:
            i += 1
            continue
            
        # Handle string literals
        if not in_comment_single and not in_comment_multi:
            if char in ["'", '"', '`']:
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char and (i == 0 or line[i-1] != '\\'):
                    in_string = False
            
        if in_string:
            i += 1
            continue
            
        # Detect class declaration
        if not class_declared and 'export class StudentExercisesComponent' in line:
            class_declared = True
            class_start_line = line_num
            print(f"Class starts at line {line_num}")
            
        # Count braces only after class declaration
        if class_declared:
            if char == '{':
                nesting += 1
                # print(f"Line {line_num}: Open brace, nesting = {nesting}")
            elif char == '}':
                nesting -= 1
                # print(f"Line {line_num}: Close brace, nesting = {nesting}")
                if nesting == 0:
                    print(f"!!! Nesting level hit 0 at line {line_num} !!!")
                    print(lines[line_num - 3].strip())
                    print(lines[line_num - 2].strip())
                    print(lines[line_num - 1].strip())
                    print(lines[line_num].strip())
                    print("-" * 40)
                    
        i += 1

print(f"Final nesting level: {nesting}")
