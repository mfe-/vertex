from math import cos, sin, pi
import logging
import numpy as np
from scipy.interpolate import splprep, splev

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource, Button, PointDrawTool, WheelZoomTool, TapTool,Scatter
from bokeh.plotting import figure
from bokeh.layouts import column, row
from bokeh.models import CustomJS, PanTool

from vertex import Vertex

# Data sources for user points and the spline
np.random.seed()  # Optional: for true randomness
x_rand = np.random.randint(512, 727, 5)
y_rand = np.random.randint(512, 727, 5)
points_source = ColumnDataSource(data=dict(x=list(x_rand), y=list(y_rand)))

# Create the plot with wheel zoom and pan tool enabled
p = figure(title="Click to add points. Spline will update.",
    tools="pan,wheel_zoom,box_zoom,tap,reset",
    #sizing_mode="stretch_both",
    #match_aspect=True,
    width=1024, height=1024
)
p.xgrid.visible = True
p.ygrid.visible = True

p.x_range.start = 0
p.x_range.end = 1024
p.y_range.start = 0
p.y_range.end = 1024


# Set wheel zoom as the active scroll tool (do not set pan as active drag tool)
p.toolbar.active_scroll = p.select_one(WheelZoomTool)

p_points = p.add_glyph(points_source, Vertex())

p_points.selection_glyph = p_points.glyph.clone()
p_points.selection_glyph.size = 16

def tap_callback(event):
    # Only allow adding points if trace is active
    if len(points_source.data['x']) < 5:
        new_x = points_source.data['x'] + [event.x]
        new_y = points_source.data['y'] + [event.y]
        points_source.data = dict(x=new_x, y=new_y)

def clear_points():
    points_source.data = dict(x=[], y=[])



# Add PointDrawTool to allow dragging points
point_draw_tool = PointDrawTool(renderers=[p_points], add=False, drag=True)
p.add_tools(point_draw_tool)
p.toolbar.active_tap = point_draw_tool

# Add tap event (still allow adding points by clicking)
p.on_event('tap', tap_callback)


def on_point_selected(attr, old, new):
    logging.info(f"Selected indices: {new}")
    # If no points are selected, reset the selection_glyph size to default
    if not new:
        p_points.selection_glyph.size = 8
    else:
        p_points.selection_glyph.size = 16


points_source.selected.on_change('indices', on_point_selected)


curdoc().add_root(column(p))
curdoc().title = "Interactive Spline Trace"