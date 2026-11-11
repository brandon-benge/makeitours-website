## What's in your design

A materials inventory lists the parts your design is made of: each line has a description, a specification, a size, a count or amount, and the part IDs it comes from. It names the exact build it was made from, so you always know which version it describes.

The list says what the design contains, nothing more. It adds no waste, rounding, stock lengths, suppliers or prices, and it isn't a shopping list, a quote or a purchase order. When the design doesn't say something, such as a grade or the contents of a prehung door, the line marks it **unresolved** instead of guessing.

## Bring Your Own Infra: the whole design, every build

Every successful build writes the inventory for the whole design, as three files in `generated/inventory/`:

- `inventory.json`, the complete record, used by the viewer and by Hosted,
- `inventory.csv`, for a spreadsheet,
- `inventory.md`, a readable table.

They also appear with the other downloads on your project's site. If a build fails, the previous inventory stays, together with the rest of the previous build.

## Hosted: the parts in view

> **Hosted does this for you.** Show only the parts you care about, and Hosted makes their materials list from the published build. Nothing is rebuilt and your design doesn't change.

1. Open your project and show the parts you want, for example one wall.
2. Tap the camera, then choose **Materials inventory** under **Materials**.
3. Review the request and press **Create Documents**. The files appear under **Documents**.

A version built before this feature can't make an inventory yet. Ask for any small change to rebuild it, then capture the view again. Nothing is charged for a request that can't be made.

## Reading the list

- **Count** lines (`each`) are pieces such as studs, doors or boards. Identical pieces share one line.
- **Length**, **area** and **volume** totals add up the parts on that line, in metres, square metres or cubic metres.
- **Unresolved** names the details the design doesn't state. Fix them in the design, not in the list.
- **Excluded** lists reference lines, groups and anything the design says to leave out, with the reason.

## Walls with openings

Walls built from layers (studs, plates, sheathing, insulation and finish) keep their parts' IDs when you move or widen a window or lengthen the wall. Only the members the change reaches are added or removed, so the inventory follows the design.

Questions? Write to [makeitours-support@bengesoftwarellc.com](mailto:makeitours-support@bengesoftwarellc.com).
