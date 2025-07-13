# %%
cancerType = ["pancreas"]
category = ["Mitomycin", "Jelmyto", "Mitosol", "Mutamycin"]

# %% [markdown]
# Using RxNav with modification to resources/js/rxnav/views/graph.js to extract the codes and names,
# need to search both drug name and brand name to pull all values.
#
# Drug names and brand names should be added in mappings files.

# %%
objs = {
    "632": ["mitomycin"],
    "1165372": ["mitomycin Injectable Product"],
    "1244550": ["mitomycin 0.2 MG/ML"],
    "1244551": ["mitomycin Ophthalmic Product"],
    "1244552": ["mitomycin Ophthalmic Solution"],
    "1244553": ["mitomycin 0.2 MG/ML Ophthalmic Solution"],
    "1244555": ["mitomycin 0.2 MG/ML [Mitosol]"],
    "1244556": ["mitomycin Ophthalmic Solution [Mitosol]"],
    "1244558": ["mitomycin 0.2 MG/ML Ophthalmic Solution [Mitosol]"],
    "1740892": ["mitomycin 5 MG"],
    "1740893": ["mitomycin Injection"],
    "1740894": ["mitomycin 5 MG Injection"],
    "1740897": ["mitomycin 40 MG"],
    "1740898": ["mitomycin 40 MG Injection"],
    "1740899": ["mitomycin 20 MG"],
    "1740900": ["mitomycin 20 MG Injection"],
    "1812477": ["mitomycin 20 MG [Mutamycin]"],
    "1812478": ["mitomycin Injection [Mutamycin]"],
    "1812480": ["mitomycin 20 MG Injection [Mutamycin]"],
    "1812481": ["mitomycin 40 MG [Mutamycin]"],
    "1812482": ["mitomycin 40 MG Injection [Mutamycin]"],
    "1812483": ["mitomycin 5 MG [Mutamycin]"],
    "1812484": ["mitomycin 5 MG Injection [Mutamycin]"],
    "2375816": ["mitomycin Pyelocalyceal Product"],
    "2375817": ["mitomycin Powder for Pyelocalyceal Solution"],
    "2375818": ["mitomycin 40 MG Powder for Pyelocalyceal Solution"],
    "2375820": ["mitomycin 40 MG [Jelmyto]"],
    "2375821": ["mitomycin Powder for Pyelocalyceal Solution [Jelmyto]"],
    "2375823": ["mitomycin 40 MG Powder for Pyelocalyceal Solution [Jelmyto]"],
}

# %%
import dataclasses
import json
from compact_json import Formatter, EolStyle


@dataclasses.dataclass
class OPDE:
    entryType: str
    cancerType: list[str]
    code: str
    display: str
    system: str
    category: list[str]


opdes = []
for code, values in objs.items():
    opdes.append(
        OPDE(
            entryType="medications",
            cancerType=cancerType,
            code=code,
            display=values[0].title(),
            system="http://www.nlm.nih.gov/research/umls/rxnorm",
            category=category,
        )
    )


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


formatter = Formatter()
formatter.indent_spaces = 2
formatter.json_eol_style = EolStyle.LF
formatter.max_inline_length = 80
formatter.use_tab_to_indent = False
formatter.max_compact_list_complexity = 0

serialized = formatter.serialize([dataclasses.asdict(o) for o in opdes])
cleaned = "\n".join(line.rstrip() for line in serialized.splitlines())
print(cleaned)
