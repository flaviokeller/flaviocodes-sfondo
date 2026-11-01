from . import blur, gradient_blur, grainy, influx, levels, palette, retro_lines

STYLES = {
    "blur": blur.render,
    "gradient_blur": gradient_blur.render,
    "grainy": grainy.render,
    "levels": levels.render,
    "palette": palette.render,
    "influx": influx.render,
    "retro_lines": retro_lines.render,
}
