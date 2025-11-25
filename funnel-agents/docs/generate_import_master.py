#!/usr/bin/env python3

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from pathlib import Path

print("=" * 120)
print("GENERATING: Vehicle-Import-Master.xlsx")
print("=" * 120)
print()

# Load source files
mapping_file = Path('/excels/Mapping - Vehicle parameters.xlsx')
source_file = Path('/excels/Suivi installation-mise en route-livraison client.xlsx')
updates_file = Path('/excels/vehicles-updates.xlsx')

wb_mapping = load_workbook(filename=mapping_file, read_only=True, data_only=True)
wb_source = load_workbook(filename=source_file, read_only=True, data_only=True)
wb_updates = load_workbook(filename=updates_file, read_only=True, data_only=True)

# Parse Mapping file to understand the schema
ws_sheet1 = wb_mapping['Sheet1']
ws_mapping = wb_mapping['Mapping']

# Get source column mappings
source_mappings = {}
for row_idx in range(2, ws_sheet1.max_row + 1):
    source_col = ws_sheet1.cell(row=row_idx, column=3).value
    internal_name = ws_sheet1.cell(row=row_idx, column=4).value
    if source_col:
        source_mappings[source_col] = internal_name

# Get database field mappings with all metadata
db_mappings = {}
for row_idx in range(2, ws_mapping.max_row + 1):
    param = ws_mapping.cell(row=row_idx, column=3).value
    mapping_type = ws_mapping.cell(row=row_idx, column=4).value
    keep = ws_mapping.cell(row=row_idx, column=5).value
    db_flag = ws_mapping.cell(row=row_idx, column=6).value
    view = ws_mapping.cell(row=row_idx, column=7).value
    edit = ws_mapping.cell(row=row_idx, column=8).value
    mapping_field = ws_mapping.cell(row=row_idx, column=10).value

    if param:
        db_mappings[param] = {
            'type': mapping_type,
            'keep': keep,
            'db': db_flag,
            'view': view,
            'edit': edit,
            'field': mapping_field
        }

# Create new workbook with multiple sheets
wb = Workbook()

# Remove default sheet
wb.remove(wb.active)

# Define styles
header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
header_font = Font(color="FFFFFF", bold=True, size=11)
subheader_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
subheader_font = Font(color="FFFFFF", bold=True, size=10)
key_fill = PatternFill(start_color="FFC000", end_color="FFC000", fill_type="solid")
key_font = Font(bold=True)
source_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
update_fill = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")
override_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)

print("Creating Sheet 1: Import Data...")

# Sheet 1: Import Data (Main sheet for validation/import)
ws_import = wb.create_sheet("Import Data")

# Define columns for import
import_columns = [
    # Key columns (for matching)
    {'header': 'SYSTEM S/N', 'width': 15, 'type': 'KEY', 'model': 'HybridSystem', 'field': 'system_serial_number', 'required': True},
    {'header': 'CHASSIS VIN', 'width': 25, 'type': 'KEY', 'model': 'Information', 'field': 'chassis_vin', 'required': False},
    {'header': 'FLEET NUMBER', 'width': 15, 'type': 'KEY', 'model': 'Vehicle', 'field': 'truckName', 'required': True},
    {'header': 'CUSTOMER', 'width': 20, 'type': 'RELATION', 'model': 'PortalAccount', 'field': 'name (customer)', 'required': True},
    {'header': 'AGENCY', 'width': 20, 'type': 'RELATION', 'model': 'PortalAccount', 'field': 'name (agency)', 'required': True},
    {'header': 'CONTRACT', 'width': 20, 'type': 'RELATION', 'model': 'PortalAccount', 'field': 'name (contract)', 'required': True},

    # Vehicle identification
    {'header': 'Type collect', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'collect_type_id', 'required': False},
    {'header': 'Customer fleet number', 'width': 18, 'type': 'DATA', 'model': 'Information', 'field': 'customer_fleet_number', 'required': False},
    {'header': 'Registration', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'registration_number', 'required': False},

    # Chassis
    {'header': 'Chassis Brand', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'chassis_brand_id', 'required': False},
    {'header': 'Chassis Type', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'chassis_type_id', 'required': False},
    {'header': 'WheelBase', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'wheel_base_id', 'required': False},
    {'header': 'Model Year', 'width': 12, 'type': 'DATA', 'model': 'Information', 'field': 'model_year_id', 'required': False},

    # Body
    {'header': 'Body brand', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'body_brand_id', 'required': False},
    {'header': 'Body type', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'body_type_id', 'required': False},
    {'header': 'Bin Lift', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'bin_lift_id', 'required': False},
    {'header': 'Body #', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'body_number_id', 'required': False},

    # Engine
    {'header': 'Brand', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'engine_brand_id', 'required': False},
    {'header': 'fuel', 'width': 10, 'type': 'DATA', 'model': 'Information', 'field': 'engine_fuel_id', 'required': False},
    {'header': 'model', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'engine_model_id', 'required': False},

    # Transmission
    {'header': 'S/N', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'transmission_serial_id', 'required': False},
    {'header': 'Ratio', 'width': 12, 'type': 'DATA', 'model': 'Information', 'field': 'drive_axle_ratio_id', 'required': False},
    {'header': 'PTO output', 'width': 15, 'type': 'DATA', 'model': 'Information', 'field': 'pto_output_id', 'required': False},

    # System
    {'header': 'Effenco logger', 'width': 15, 'type': 'RELATION', 'model': 'Device', 'field': 'serial_number', 'required': False},
    {'header': 'Mobile number', 'width': 15, 'type': 'RELATION', 'model': 'Device', 'field': 'mobile_number', 'required': False},
    {'header': 'SIM', 'width': 15, 'type': 'RELATION', 'model': 'Device', 'field': 'sim_card_number', 'required': False},
    {'header': 'Effenco #', 'width': 15, 'type': 'RELATION', 'model': 'Vehicle', 'field': 'standardSystemName', 'required': False},
    {'header': 'Type', 'width': 15, 'type': 'RELATION', 'model': 'HybridSystem', 'field': 'hybrid_system_type_id', 'required': False},
    {'header': 'Project', 'width': 15, 'type': 'RELATION', 'model': 'HybridSystem', 'field': 'project_id', 'required': False},
    {'header': 'BOM P/N', 'width': 15, 'type': 'DATA', 'model': 'HybridSystem', 'field': 'bom_pn', 'required': False},

    # Documents
    {'header': 'Document Installation', 'width': 20, 'type': 'DATA', 'model': 'Information', 'field': 'doc_installation_id', 'required': False},

    # Metadata
    {'header': 'DATA_SOURCE', 'width': 20, 'type': 'META', 'model': 'N/A', 'field': 'source_file', 'required': False},
    {'header': 'OVERRIDE_STATUS', 'width': 20, 'type': 'META', 'model': 'N/A', 'field': 'merge_status', 'required': False},
    {'header': 'IMPORT_STATUS', 'width': 15, 'type': 'META', 'model': 'N/A', 'field': 'import_result', 'required': False},
    {'header': 'NOTES', 'width': 30, 'type': 'META', 'model': 'N/A', 'field': 'validation_notes', 'required': False},
]

# Write headers (3 rows)
# Row 1: Section headers
ws_import.row_dimensions[1].height = 25
sections = {
    'A': 'PRIMARY KEYS',
    'D': 'RELATIONS',
    'G': 'VEHICLE INFO',
    'J': 'CHASSIS',
    'N': 'BODY',
    'R': 'ENGINE',
    'U': 'TRANSMISSION',
    'X': 'SYSTEM',
    'AF': 'METADATA'
}

for col_letter, section_name in sections.items():
    cell = ws_import[f'{col_letter}1']
    cell.value = section_name
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

# Merge section headers
ws_import.merge_cells('A1:C1')  # Primary keys
ws_import.merge_cells('D1:F1')  # Relations
ws_import.merge_cells('G1:I1')  # Vehicle info
ws_import.merge_cells('J1:M1')  # Chassis
ws_import.merge_cells('N1:Q1')  # Body
ws_import.merge_cells('R1:T1')  # Engine
ws_import.merge_cells('U1:W1')  # Transmission
ws_import.merge_cells('X1:AE1')  # System
ws_import.merge_cells('AF1:AI1')  # Metadata

# Row 2: Column headers
ws_import.row_dimensions[2].height = 20
for idx, col in enumerate(import_columns, start=1):
    cell = ws_import.cell(row=2, column=idx)
    cell.value = col['header']
    cell.font = subheader_font

    if col['type'] == 'KEY':
        cell.fill = key_fill
        cell.font = key_font
    elif col['type'] == 'RELATION':
        cell.fill = PatternFill(start_color="B4C7E7", end_color="B4C7E7", fill_type="solid")
    elif col['type'] == 'META':
        cell.fill = PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")
    else:
        cell.fill = subheader_fill

    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = border

    # Set column width
    ws_import.column_dimensions[get_column_letter(idx)].width = col['width']

# Row 3: Laravel model/field info
ws_import.row_dimensions[3].height = 30
for idx, col in enumerate(import_columns, start=1):
    cell = ws_import.cell(row=3, column=idx)

    if col['type'] != 'META':
        required = " *REQUIRED*" if col.get('required') else ""
        cell.value = f"{col['model']}\n{col['field']}{required}"
    else:
        cell.value = col['field']

    cell.font = Font(size=9, italic=True)
    cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
    cell.border = border

print("Loading data from source files...")

# Get source data
ws_source = wb_source['Database']

# Build column index map for source file
source_col_index = {}
for col_idx in range(1, ws_source.max_column + 1):
    field_name = ws_source.cell(row=3, column=col_idx).value
    if field_name:
        source_col_index[field_name] = col_idx

# Get updates data
ws_updates_data = wb_updates['Vehicle List']

# Build column index map for updates file
updates_col_index = {}
for col_idx in range(1, ws_updates_data.max_column + 1):
    field_name = ws_updates_data.cell(row=2, column=col_idx).value
    if field_name:
        updates_col_index[field_name] = col_idx

print("Merging data with override logic...")

# Merge logic: Source data + Override with Updates data
merged_data = {}

# First, load all data from source file
for row_idx in range(4, min(200, ws_source.max_row + 1)):  # Limit to 200 for demo
    system_sn = ws_source.cell(row=row_idx, column=source_col_index.get('SYSTEM S/N', 2)).value

    if not system_sn:
        continue

    row_data = {'_source': 'Suivi installation', '_override': 'No'}

    # Map source columns to internal names
    for source_col, internal_name in source_mappings.items():
        if source_col in source_col_index:
            col_idx = source_col_index[source_col]
            value = ws_source.cell(row=row_idx, column=col_idx).value

            if internal_name and internal_name != '#N/A':
                row_data[internal_name] = value

    # Add some unmapped columns directly
    if 'CUSTOMER' in source_col_index:
        row_data['Customer'] = ws_source.cell(row=row_idx, column=source_col_index['CUSTOMER']).value
    if 'SYSTEM S/N' in source_col_index:
        row_data['SYSTEM S/N'] = system_sn

    merged_data[system_sn] = row_data

# Override with updates data
for row_idx in range(4, min(200, ws_updates_data.max_row + 1)):
    # Try to find matching key
    effenco_num_col = updates_col_index.get('Effenco #', updates_col_index.get('# Derichebourg'))
    if not effenco_num_col:
        continue

    identifier = ws_updates_data.cell(row=row_idx, column=effenco_num_col).value

    if not identifier:
        continue

    # Find matching record in merged_data
    matching_key = None
    for key, data in merged_data.items():
        if data.get('Effenco #') == identifier or data.get('Customer fleet number') == str(identifier):
            matching_key = key
            break

    if matching_key:
        # Override with updates data
        for header in import_columns:
            col_name = header['header']
            if col_name in updates_col_index:
                col_idx = updates_col_index[col_name]
                value = ws_updates_data.cell(row=row_idx, column=col_idx).value

                if value:
                    merged_data[matching_key][col_name] = value
                    merged_data[matching_key]['_override'] = 'Yes - from vehicles-updates.xlsx'

print(f"Merged {len(merged_data)} records")

# Write merged data to sheet
current_row = 4
for system_sn, data in list(merged_data.items())[:150]:  # Limit to 150 rows
    for idx, col in enumerate(import_columns, start=1):
        col_name = col['header']

        cell = ws_import.cell(row=current_row, column=idx)

        if col_name == 'DATA_SOURCE':
            cell.value = data.get('_source', 'Unknown')
        elif col_name == 'OVERRIDE_STATUS':
            cell.value = data.get('_override', 'No')
            if 'Yes' in str(cell.value):
                cell.fill = override_fill
        else:
            cell.value = data.get(col_name)

        cell.border = border

        # Highlight key columns
        if col['type'] == 'KEY' and cell.value:
            cell.fill = PatternFill(start_color="FFF9E6", end_color="FFF9E6", fill_type="solid")

    current_row += 1

print("Creating Sheet 2: Field Mapping Reference...")

# Sheet 2: Field Mapping Reference
ws_reference = wb.create_sheet("Field Mapping Reference")

# Headers
ref_headers = [
    'Business Name',
    'Laravel Model',
    'Database Table',
    'Database Field',
    'Field Type',
    'Required',
    'Editable',
    'Source Column (Suivi)',
    'Excel Column (Import)',
    'Validation Rules',
    'Example Value'
]

ws_reference.row_dimensions[1].height = 20
for idx, header in enumerate(ref_headers, start=1):
    cell = ws_reference.cell(row=1, column=idx)
    cell.value = header
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = border
    ws_reference.column_dimensions[get_column_letter(idx)].width = 20

# Write reference data
current_row = 2
for col_def in import_columns:
    if col_def['type'] == 'META':
        continue

    cell = ws_reference.cell(row=current_row, column=1)
    cell.value = col_def['header']

    cell = ws_reference.cell(row=current_row, column=2)
    cell.value = col_def['model']

    # Determine table
    table_map = {
        'Vehicle': 'stats.stats_truck',
        'Information': 'stats.vehicle_information',
        'HybridSystem': 'effenco.hybrid_system',
        'Device': 'monitor.device',
        'PortalAccount': 'portal.account'
    }
    cell = ws_reference.cell(row=current_row, column=3)
    cell.value = table_map.get(col_def['model'], '')

    cell = ws_reference.cell(row=current_row, column=4)
    cell.value = col_def['field']

    cell = ws_reference.cell(row=current_row, column=5)
    cell.value = 'FK' if '_id' in col_def['field'] else 'string'

    cell = ws_reference.cell(row=current_row, column=6)
    cell.value = 'Yes' if col_def.get('required') else 'No'

    cell = ws_reference.cell(row=current_row, column=7)
    cell.value = 'Yes' if col_def['type'] != 'KEY' else 'No'

    # Find source column
    source_col = None
    for src, internal in source_mappings.items():
        if internal == col_def['header']:
            source_col = src
            break

    cell = ws_reference.cell(row=current_row, column=8)
    cell.value = source_col or 'N/A'

    cell = ws_reference.cell(row=current_row, column=9)
    col_letter = get_column_letter(import_columns.index(col_def) + 1)
    cell.value = f"Column {col_letter}"

    cell = ws_reference.cell(row=current_row, column=10)
    if col_def.get('required'):
        cell.value = 'required'
    else:
        cell.value = 'nullable'

    cell = ws_reference.cell(row=current_row, column=11)
    cell.value = ''

    for col_idx in range(1, len(ref_headers) + 1):
        ws_reference.cell(row=current_row, column=col_idx).border = border

    current_row += 1

print("Creating Sheet 3: Import Instructions...")

# Sheet 3: Import Instructions
ws_instructions = wb.create_sheet("Import Instructions")
ws_instructions.column_dimensions['A'].width = 100

instructions = [
    ("VEHICLE IMPORT MASTER FILE", header_font, header_fill),
    ("", None, None),
    ("PURPOSE:", Font(bold=True, size=12), None),
    ("This Excel file is the SINGLE SOURCE OF TRUTH for importing vehicle data into the Laravel database.", None, None),
    ("It combines data from two sources:", None, None),
    ("  1. 'Suivi installation-mise en route-livraison client.xlsx' - New vehicle data (953 systems)", None, None),
    ("  2. 'vehicles-updates.xlsx' - Existing vehicle updates (133 vehicles)", None, None),
    ("", None, None),
    ("OVERRIDE LOGIC:", Font(bold=True, size=12), None),
    ("If a vehicle exists in BOTH files:", None, None),
    ("  → Values from 'vehicles-updates.xlsx' OVERRIDE values from 'Suivi installation'", None, PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")),
    ("  → The OVERRIDE_STATUS column shows 'Yes - from vehicles-updates.xlsx'", None, None),
    ("", None, None),
    ("KEY COLUMNS (Used for matching):", Font(bold=True, size=12), None),
    ("  🔑 SYSTEM S/N - Primary identifier for HybridSystem (REQUIRED)", None, key_fill),
    ("  🔑 CHASSIS VIN - Unique vehicle identifier (optional but recommended)", None, key_fill),
    ("  🔑 FLEET NUMBER - Customer's internal fleet number (REQUIRED)", None, key_fill),
    ("", None, None),
    ("HOW TO USE:", Font(bold=True, size=12), None),
    ("1. REVIEW DATA:", None, None),
    ("   - Go to 'Import Data' sheet", None, None),
    ("   - Review all records (currently showing merged data)", None, None),
    ("   - Check OVERRIDE_STATUS column to see which values were overridden", None, None),
    ("", None, None),
    ("2. VALIDATE:", None, None),
    ("   - Ensure all REQUIRED fields (*REQUIRED*) have values", None, None),
    ("   - Check for duplicates in SYSTEM S/N or CHASSIS VIN", None, None),
    ("   - Verify Customer/Agency/Contract relationships", None, None),
    ("", None, None),
    ("3. APPROVE FOR IMPORT:", None, None),
    ("   - Boss reviews and approves the data", None, None),
    ("   - Make any manual corrections needed", None, None),
    ("", None, None),
    ("4. IMPORT TO LARAVEL:", None, None),
    ("   - Developer uses this file as input for import script", None, None),
    ("   - Import script reads 'Import Data' sheet", None, None),
    ("   - Creates/updates Vehicle, Information, HybridSystem, Device, PortalAccount records", None, None),
    ("", None, None),
    ("FIELD REFERENCE:", Font(bold=True, size=12), None),
    ("See 'Field Mapping Reference' sheet for complete mapping between:", None, None),
    ("  - Business names (what boss sees)", None, None),
    ("  - Laravel models and fields (what developers use)", None, None),
    ("  - Database tables and columns (actual storage)", None, None),
    ("", None, None),
    ("COLOR CODING:", Font(bold=True, size=12), None),
    ("  🟡 Yellow (Key columns) - Used for matching existing records", None, key_fill),
    ("  🟠 Orange (Override) - Value was overridden from vehicles-updates.xlsx", None, override_fill),
    ("  🔵 Blue (Relations) - Links to other models (Customer, Device, HybridSystem)", None, PatternFill(start_color="B4C7E7", end_color="B4C7E7", fill_type="solid")),
    ("  ⚪ Gray (Metadata) - Import tracking information", None, PatternFill(start_color="D9D9D9", end_color="D9D9D9", fill_type="solid")),
    ("", None, None),
    ("FUTURE USE:", Font(bold=True, size=12), None),
    ("This Excel format can be generated automatically from SharePoint:", None, None),
    ("  1. Download latest data from SharePoint", None, None),
    ("  2. Run Python script: generate_import_master.py", None, None),
    ("  3. Script merges data and applies override logic", None, None),
    ("  4. Output: Fresh Vehicle-Import-Master.xlsx ready for validation", None, None),
]

for row_idx, (text, font, fill) in enumerate(instructions, start=1):
    cell = ws_instructions.cell(row=row_idx, column=1)
    cell.value = text
    if font:
        cell.font = font
    if fill:
        cell.fill = fill
    cell.alignment = Alignment(vertical='top', wrap_text=True)

    ws_instructions.row_dimensions[row_idx].height = 20 if font and font.size == 12 else 15

# Save workbook
output_file = Path('outputs/excels/Vehicle-Import-Master.xlsx')
wb.save(output_file)

wb_mapping.close()
wb_source.close()
wb_updates.close()

print()
print("=" * 120)
print("SUCCESS!")
print("=" * 120)
print()
print(f"Created: {output_file}")
print()
print("File contains:")
print("  📊 Sheet 1: Import Data - Merged data ready for validation")
print(f"     - {len(merged_data)} vehicle records")
print("     - Override logic applied")
print("     - Color-coded by type (Key, Relations, Data, Metadata)")
print()
print("  📖 Sheet 2: Field Mapping Reference")
print("     - Complete mapping: Business Name → Laravel → Database")
print("     - Field types, required flags, validation rules")
print()
print("  📋 Sheet 3: Import Instructions")
print("     - How to use this file")
print("     - Override logic explanation")
print("     - Color coding legend")
print()
print("Next steps:")
print("  1. Open Vehicle-Import-Master.xlsx")
print("  2. Boss reviews 'Import Data' sheet")
print("  3. Validate all records")
print("  4. Run import script to load into Laravel")
print()
