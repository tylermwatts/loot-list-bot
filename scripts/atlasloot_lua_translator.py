#!/usr/bin/env python3
# Usage: python atlasloot_lua_translator.py <path_to_altasloot_module>/data.lua output.json
import sys
zone_template = \
'''{
  "abbreviation": "",
  "zone": "%s",
  "bosses": [
'''
zone_close = \
'''  ]
},

'''
section_template = \
'''    {
      "name": "%s",
      "reaction": "",
      "items": [
'''
section_close = \
'''      ]
    },

'''
item_template = \
'''        {
          "name": "%s",
          "wowhead_link": "https://classic.wowhead.com/item=%s"
        },
'''
with open(sys.argv[1],"r") as input_file:
	with open(sys.argv[2],"w") as output_file:
		zone_stack = 0
		section_stack = 0
		for line in input_file:
			tokens = line.lstrip().split()
			try:
				if tokens[0] == 'AtlasMapID':
					if section_stack == 1:
						output_file.write(section_close)
						section_stack = 0
					if zone_stack == 1:
						output_file.write(zone_close)
					zone = tokens[2].lstrip('"').rstrip('",')
					output_file.write(zone_template%(zone))
					zone_stack = 1
				if tokens[0] == 'name':
					if section_stack == 1:
						output_file.write(section_close)
					name = ' '.join(tokens[2:])[4:].rstrip('"],')
					output_file.write(section_template%(name))
					section_stack = 1
				if line[:5] == '\t\t\t\t{': # bad way to identify it, but meh
					try:
						item_name = ' '.join(tokens[tokens.index('--')+1:])
						item_id = tokens[2]
						output_file.write(item_template%(item_name, item_id))
					except ValueError:
						pass
			except IndexError:
				pass
		if section_stack == 1:
			output_file.write(section_close)
			section_stack = 0
		if zone_stack == 1:
			output_file.write(zone_close)

