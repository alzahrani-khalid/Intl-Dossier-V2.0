#!/usr/bin/env python3
"""
Script to copy country maps from source to frontend public assets
Maps country names to ISO codes and creates elegant background images
"""

import os
import shutil
from pathlib import Path

SOURCE_DIR = Path("/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/maps")
DEST_DIR = Path("/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/public/assets/maps")

# Map filename (without .svg) to ISO code
MAP_TO_ISO = {
    # GCC Countries
    "Saudi Arabia": "sa",
    "UnitedArabEmirates": "ae",
    "Kuwait": "kw",
    "Qatar": "qa",
    "Bahrain": "bh",
    "Oman": "om",

    # Middle East
    "Egypt": "eg",
    "Jordan": "jo",
    "Lebanon": "lb",
    "Syria": "sy",
    "Iraq": "iq",
    "Palestine": "ps",
    "Israel": "il",
    "Yemen": "ye",
    "Iran": "ir",
    "Turkey": "tr",

    # North Africa
    "Morocco": "ma",
    "Algeria": "dz",
    "Tunisia": "tn",
    "Libya": "ly",
    "Sudan": "sd",
    "Mauritania": "mr",

    # Asia
    "China": "cn",
    "Japan": "jp",
    "SouthKorea": "kr",
    "South Korea": "kr",
    "NorthKorea": "kp",
    "North Korea": "kp",
    "India": "in",
    "Pakistan": "pk",
    "Bangladesh": "bd",
    "Indonesia": "id",
    "Malaysia": "my",
    "Singapore": "sg",
    "Thailand": "th",
    "Vietnam": "vn",
    "Philippines": "ph",

    # Europe
    "United Kingdom": "gb",
    "France": "fr",
    "Germany": "de",
    "Italy": "it",
    "Spain": "es",
    "Netherlands": "nl",
    "Belgium": "be",
    "Switzerland": "ch",
    "Austria": "at",
    "Sweden": "se",
    "Norway": "no",
    "Denmark": "dk",
    "Finland": "fi",
    "Poland": "pl",
    "Russia": "ru",
    "Ukraine": "ua",
    "Greece": "gr",
    "Portugal": "pt",
    "CzechRepublic": "cz",
    "Czech Republic": "cz",

    # Americas
    "UnitedStatesofAmerica": "us",
    "United States": "us",
    "USA": "us",
    "Canada": "ca",
    "Mexico": "mx",
    "Brazil": "br",
    "Argentina": "ar",
    "Chile": "cl",
    "Colombia": "co",
    "Peru": "pe",

    # Oceania
    "Australia": "au",
    "NewZealand": "nz",
    "New Zealand": "nz",

    # Additional countries (alphabetically)
    "Afghanistan": "af",
    "Albania": "al",
    "Andorra": "ad",
    "Angola": "ao",
    "Anguilla": "ai",
    "Antigua Barbuda": "ag",
    "Armenia": "am",
    "Aruba": "aw",
    "Azerbaijan": "az",
    "Bahamas": "bs",
    "Barbados": "bb",
    "Belarus": "by",
    "Belize": "bz",
    "Benin": "bj",
    "Bermuda": "bm",
    "Bhutan": "bt",
    "Bolivia": "bo",
    "Bosnia Herzegovina": "ba",
    "Botswana": "bw",
    "Brunei": "bn",
    "Bulgaria": "bg",
    "BurkinaFaso": "bf",
    "Burkina Faso": "bf",
    "Burundi": "bi",
    "Cambodia": "kh",
    "Cameroon": "cm",
    "CapeVerde": "cv",
    "Cape Verde": "cv",
    "CaymanIslands": "ky",
    "Cayman Islands": "ky",
    "CentralAfricanRepublic": "cf",
    "Central African Republic": "cf",
    "Chad": "td",
    "Comoros": "km",
    "DRCongo": "cd",
    "DR Congo": "cd",
    "Democratic Republic of the Congo": "cd",
    "RepublicCongo": "cg",
    "Republic Congo": "cg",
    "Republic of the Congo": "cg",
    "CostaRica": "cr",
    "Costa Rica": "cr",
    "Croatia": "hr",
    "Cuba": "cu",
    "Cyprus": "cy",
    "Djibouti": "dj",
    "Dominica": "dm",
    "DominicanRepublic": "do",
    "Dominican Republic": "do",
    "Ecuador": "ec",
    "ElSalvador": "sv",
    "El Salvador": "sv",
    "EquatorialGuinea": "gq",
    "Equatorial Guinea": "gq",
    "Eritrea": "er",
    "Estonia": "ee",
    "Eswatini": "sz",
    "Ethiopia": "et",
    "Fiji": "fj",
    "Gabon": "ga",
    "Gambia": "gm",
    "Georgia": "ge",
    "Ghana": "gh",
    "Grenada": "gd",
    "Guatemala": "gt",
    "Guinea": "gn",
    "GuineaBissau": "gw",
    "Guinea-Bissau": "gw",
    "Guinea Bissau": "gw",
    "Guyana": "gy",
    "Haiti": "ht",
    "Honduras": "hn",
    "Hungary": "hu",
    "Iceland": "is",
    "Ireland": "ie",
    "IvoryCoast": "ci",
    "Ivory Coast": "ci",
    "Jamaica": "jm",
    "Kazakhstan": "kz",
    "Kenya": "ke",
    "Kiribati": "ki",
    "Kosovo": "xk",
    "Kyrgyzstan": "kg",
    "Laos": "la",
    "Latvia": "lv",
    "Lesotho": "ls",
    "Liberia": "lr",
    "Liechtenstein": "li",
    "Lithuania": "lt",
    "Luxembourg": "lu",
    "Madagascar": "mg",
    "Malawi": "mw",
    "Maldives": "mv",
    "Mali": "ml",
    "Malta": "mt",
    "MarshallIslands": "mh",
    "Marshall Islands": "mh",
    "Mauritius": "mu",
    "Micronesia": "fm",
    "Moldova": "md",
    "Monaco": "mc",
    "Mongolia": "mn",
    "Montenegro": "me",
    "Montserrat": "ms",
    "Mozambique": "mz",
    "Myanmar": "mm",
    "Namibia": "na",
    "Nauru": "nr",
    "Nepal": "np",
    "Nicaragua": "ni",
    "Niger": "ne",
    "Nigeria": "ng",
    "NorthMacedonia": "mk",
    "North Macedonia": "mk",
    "Palau": "pw",
    "Panama": "pa",
    "PapuaNewGuinea": "pg",
    "Papua New Guinea": "pg",
    "Paraguay": "py",
    "Romania": "ro",
    "Rwanda": "rw",
    "SaintKitts Nevis": "kn",
    "Saint Kitts Nevis": "kn",
    "Saint Kitts and Nevis": "kn",
    "SaintLucia": "lc",
    "Saint Lucia": "lc",
    "SaintVincent Grenadines": "vc",
    "Saint Vincent Grenadines": "vc",
    "Saint Vincent and the Grenadines": "vc",
    "Samoa": "ws",
    "SanMarino": "sm",
    "San Marino": "sm",
    "SaoTome Principe": "st",
    "Sao Tome Principe": "st",
    "Sao Tome and Principe": "st",
    "Senegal": "sn",
    "Serbia": "rs",
    "Seychelles": "sc",
    "SierraLeone": "sl",
    "Sierra Leone": "sl",
    "Slovakia": "sk",
    "Slovenia": "si",
    "SolomonIslands": "sb",
    "Solomon Islands": "sb",
    "Somalia": "so",
    "SouthAfrica": "za",
    "South Africa": "za",
    "SouthSudan": "ss",
    "South Sudan": "ss",
    "SriLanka": "lk",
    "Sri Lanka": "lk",
    "Suriname": "sr",
    "Taiwan": "tw",
    "Tajikistan": "tj",
    "Tanzania": "tz",
    "TimorLeste": "tl",
    "Timor-Leste": "tl",
    "Timor Leste": "tl",
    "Togo": "tg",
    "Tonga": "to",
    "TrinidadTobago": "tt",
    "Trinidad Tobago": "tt",
    "Trinidad and Tobago": "tt",
    "Turkmenistan": "tm",
    "Tuvalu": "tv",
    "Uganda": "ug",
    "Uruguay": "uy",
    "Uzbekistan": "uz",
    "Vanuatu": "vu",
    "VaticanCity": "va",
    "Vatican City": "va",
    "Venezuela": "ve",
    "Zambia": "zm",
    "Zimbabwe": "zw",
    "AmericanSamoa": "as",
    "American Samoa": "as",
}

def main():
    # Create destination directory
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    count = 0
    skipped = []

    # Process all SVG files in source directory
    for file_path in SOURCE_DIR.glob("*.svg"):
        filename = file_path.stem  # Get filename without .svg extension

        if filename in MAP_TO_ISO:
            iso_code = MAP_TO_ISO[filename]
            dest_path = DEST_DIR / f"{iso_code}.svg"
            shutil.copy2(file_path, dest_path)
            count += 1
            print(f"✓ {filename} → {iso_code}.svg")
        else:
            skipped.append(filename)

    print()
    print(f"✅ Copied {count} country map files to {DEST_DIR}")
    print(f"📁 Files are named as: sa.svg, us.svg, cn.svg, etc.")
    print(f"🗺️  Country maps ready for use as elegant card backgrounds")

    if skipped:
        print(f"\n⚠️  Skipped {len(skipped)} files (no ISO mapping):")
        for name in sorted(skipped)[:10]:  # Show first 10
            print(f"   - {name}")
        if len(skipped) > 10:
            print(f"   ... and {len(skipped) - 10} more")

if __name__ == "__main__":
    main()
