#!/usr/bin/env python3
import csv

# Read the CSV file
with open('pokemon.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    pokemon_list = list(reader)

# Write TypeScript file
with open('pokemon.ts', 'w', encoding='utf-8') as f:
    f.write('export interface Pokemon {\n')
    f.write('  index: string;\n')
    f.write('  name: string;\n')
    f.write('  type1: string;\n')
    f.write('  type2: string;\n')
    f.write('}\n\n')
    f.write('export const pokemons: Pokemon[] = [\n')

    for row in pokemon_list:
        # Escape single quotes in names
        name = row['name'].replace("'", "\\'")
        f.write(f"  {{ index: '{row['ndex']}', name: '{name}', type1: '{row['type1']}', type2: '{row['type2']}' }},\n")

    f.write('];\n')

print(f"Converted {len(pokemon_list)} Pokemon to pokemon.ts")
