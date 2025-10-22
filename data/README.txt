This demo uses a procedural shader to visualize wind-like particles.
To plug in NOAA GFS wind vectors later, you can:
- Preprocess GRIB2 to JSON grid (u/v components), and
- Update app.js to advect particles according to the grid field.