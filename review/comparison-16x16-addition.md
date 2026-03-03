# 16' × 16'-1¾" Addition: Lumberly vs PA Quantities

## Scope
- **Footprint:** 16' × 16'-1¾" (16.15') = **258.3 sq ft**
- **Addition:** tie-in along the **length** (16' side) → **3 walls**, perimeter = 16 + 16.15 + 16.15 = **48.29 ft**
- **Assumptions:** 16" OC floor & walls, 10% waste, 8' ceiling, 1 story, no roof/openings/partitions in takeoff

---

## Lumberly Calculations (from `calculations.ts`)

| Item | Formula | Result |
|------|---------|--------|
| **Perimeter** | length + 2×width | 16 + 2×16.1458 = **49 lin ft** (rounded) |
| **Floor joists** | ceil(run"/16")+1, span 16' or 16.15' | **14** (joists along width) or **13** (joists along length); length **18'** (span+6 rounded to 2' increment) |
| **Rim joist** | ceil(perimeter) | **49 lin ft** |
| **PT sill plate** | ceil(perimeter) | **49 lin ft** |
| **Subfloor** | ceil(258.3 × 1.1 / 32) | **9 sheets** |
| **Exterior studs** | ceil(perimeter×12/16)+4 | **41 pcs** (2×6×8') |
| **Exterior plates** | 3 courses × 49 / 8' | **19 pcs** (2×6×8') |
| **Wall sheathing** | ceil((49×8)×1.1/32) | **14 sheets** |

---

## Side-by-Side: Lumberly vs PA (PA from quote 316234)

| Item | Lumberly (16'×16'-1¾") | PA (quote) | Match? |
|------|-------------------------|------------|--------|
| **PT mud sill** | 49 lin ft (2×6 PT sill) | 64 lin ft (4× 2×6×16′) | No – PA higher |
| **Floor joists** | 13–14 pcs @ 18' (2×10) | 11 pcs @ 16' (2×10) | No – count/length differ |
| **Rim joist** | 49 lin ft | 64 lin ft (4× 16′) | No – PA higher |
| **Ledger** | *(not in Lumberly)* | 2 pcs | N/A |
| **Subfloor** | 9 sheets | 9 sheets | **Yes** |
| **Joist hangers** | *(not in Lumberly)* | 11 | N/A |
| **Exterior studs** | 41 pcs (2×6×8') | 63 studs | No – PA higher |
| **Plates** | 19 pcs (2×6×8') | 15 pcs (2×6×16′) | No – PA different length/count |
| **Wall sheathing** | 14 sheets | 22 sheets | No – PA higher |
| **Interior studs** | 0 (no partitions) | 21 pcs (2×6×8') | N/A |
| **Blocking / headers** | *(per openings)* | 5 blocking, etc. | N/A |

---

## Why the Differences?

1. **Perimeter / footprint**  
   Lumberly uses a **16'×16'-1¾"** addition → **49 ft** of wall.  
   PA’s 64 ft sill/rim (4×16′) implies a **64 ft perimeter** (e.g. 32+16+16 or another combo), so PA’s quote is likely based on a **different footprint**, not this exact rectangle.

2. **Joists**  
   For 16'×16'-1¾" at 16" OC, Lumberly gives **13–14 joists** spanning 16' or 16.15' (ordered as 18').  
   PA’s **11 joists @ 16'** fits a **shorter run** (~10 spaces ≈ 13.3'), consistent with a smaller or different layout.

3. **Studs & sheathing**  
   Fewer lineal feet of wall (49 vs 64) → fewer studs (41 vs 63) and less sheathing (14 vs 22).  
   So for the **same 16'×16'-1¾"** scope, Lumberly’s quantities are internally consistent and **lower** than PA’s.

4. **Subfloor**  
   **Matches**: 258.3 sq ft × 1.1 waste → 9 sheets, same as PA.

---

## Conclusion

- For a **16' × 16'-1¾"** addition, **Lumberly and PA only line up on subfloor (9 sheets)**.
- All other PA counts (sill, rim, joists, studs, plates, sheathing) are **higher** and fit a **larger perimeter** (~64 ft) and different joist run, not this exact 16'×16'-1¾" box.
- So quantities “work out the same” **only if** PA’s scope is changed to match this footprint (and tie-in), or Lumberly’s dimensions are changed to match whatever footprint PA used.

---

*Generated for Lumberly vs PA comparison; PA numbers from review/Lumber Packages.docx (quote 316234).*

---

## If PA counted 4 walls (full perimeter) instead of 3

If PA treated the addition as a **full rectangle** (4 walls) instead of 3 walls (one side tied to existing):

| Item | 4-wall perimeter | PA | Match? |
|------|-------------------|-----|--------|
| **Perimeter** | 2×(16 + 16.15) = **64.3 ft** | 64 lin ft (4×16′) | **Yes** |
| **PT sill / Rim** | 64 lin ft | 64 lin ft | **Yes** |
| **Subfloor** | 9 sheets | 9 sheets | **Yes** |

So **sill and rim line up exactly** if PA used full perimeter. That would mean they quoted as if the addition had four sides (e.g. standalone box or they didn't subtract the tie-in side). Studs (63) and sheathing (22) would still be higher than a 3-wall takeoff at 49 ft, but consistent with 64 ft of wall: e.g. studs ≈ ceil(64×12/16)+corners, and sheathing for 64×8 = 512 sq ft → ~18 sheets before waste, so 22 with waste/overlap is plausible for 4 walls.

**Bottom line:** If PA counted **4 walls** for the same 16'×16'-1¾" footprint, then sill and rim (64 ft) match; the remaining differences are joist count/length and how they count studs/plates/sheathing (and ledger/hangers, which Lumberly doesn't list).

### Do Lumberly and PA match if we both use 4 walls?

Only **partially**. For the same 16'×16'-1¾" box with full perimeter (64 ft):

| Item | Lumberly (4-wall) | PA | Match? |
|------|-------------------|-----|--------|
| PT sill | 64 lin ft | 64 lin ft | **Yes** |
| Rim joist | 64 lin ft | 64 lin ft | **Yes** |
| Subfloor | 9 sheets | 9 sheets | **Yes** |
| Floor joists | 13–14 pcs @ 18' | 11 pcs @ 16' | **No** (count & length differ) |
| Exterior studs | ~52 pcs (ceil(64×12/16)+4) | 63 pcs | **No** |
| Plates | ~24 pcs 8' (or different 16' equiv) | 15 pcs 16' | **No** |
| Wall sheathing | ~18 sheets (64×8×1.1/32) | 22 sheets | **No** |

So **sill, rim, and subfloor** align; **joists, studs, plates, and sheathing** still don't—different formulas, ordering lengths, or PA including extras (openings, blocking, interior). The numbers don't fully match.
