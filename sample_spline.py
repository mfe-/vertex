from math import cos, sin, pi
import logging
import numpy as np
from scipy.interpolate import splprep, splev

from bokeh.io import curdoc
from bokeh.models import ColumnDataSource, Button, PointDrawTool, WheelZoomTool, TapTool,Scatter
from bokeh.plotting import figure
from bokeh.layouts import column, row
from bokeh.models import CustomJS, PanTool
from bokeh.models import Button
from vertex import Vertex

# start with bokeh serve .\sample_spline.py
np.random.seed() 
x_rand = np.random.randint(512, 727, 5)
y_rand = np.random.randint(512, 727, 5)
colors = ["red" ,"black", "green", "red","red"]
#               0, 1, 2, 3, 4 
trace_widths = [5, 2, 5, 2, 2]
points_source = ColumnDataSource(data=dict(x=list(x_rand), y=list(y_rand), color=colors, trace_width=trace_widths))

# Create the plot with wheel zoom and pan tool enabled
p = figure(title="bokeh serve .\sample_spline.py",
    tools="pan,wheel_zoom,box_zoom,tap,reset",
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

# Use the color column for line_color in the Vertex glyph
p_points = p.add_glyph(points_source, Vertex(line_color='color', line_width='trace_width'))
# p.scatter('x', 'y', source=points_source, color='color', size=12)

p_points.selection_glyph = p_points.glyph.clone()
p_points.selection_glyph.size = 16

def tap_callback(event):
    # Only allow adding points if trace is active
    if len(points_source.data['x']) < 5:
        new_x = points_source.data['x'] + [event.x]
        new_y = points_source.data['y'] + [event.y]
        points_source.data = dict(x=new_x, y=new_y)

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

def change_line_width():
    data = points_source.data.copy()
    data['trace_width'][2] = 10
    points_source.data = data

points_source_id = points_source.id
js_code = '''
    // Store state on window to avoid multiple listeners
    if (!window._bokeh_pan_key_listener_added) {
        window._bokeh_pan_key_listener_added = true;
        const pointsSource = Bokeh.documents[0].get_model_by_id("%s");

        window.addEventListener('keydown', function(e) {
            // Delete selected point(s) on DEL
            if ((e.key === 'Delete' || e.key === 'Del') && pointsSource && pointsSource.selected.indices.length > 0) {
                const inds = pointsSource.selected.indices;
                const x = pointsSource.data.x.slice();
                const y = pointsSource.data.y.slice();
                // Remove all selected indices (from last to first)
                inds.sort((a,b)=>b-a).forEach(i => { x.splice(i,1); y.splice(i,1); });
                pointsSource.data = {x: x, y: y};
                pointsSource.selected.indices = [];
            }
            // Insert midpoint on 'p' if exactly two points are selected
            if ((e.key === 'p' || e.key === 'P') && pointsSource && pointsSource.selected.indices.length === 2) {
                const inds = pointsSource.selected.indices.slice();
                const x = pointsSource.data.x.slice();
                const y = pointsSource.data.y.slice();
                const color = pointsSource.data.color ? pointsSource.data.color.slice() : null;
                const trace_width = pointsSource.data.trace_width ? pointsSource.data.trace_width.slice() : null;
                const i0 = inds[0], i1 = inds[1];
                const mx = (x[i0] + x[i1]) / 2;
                const my = (y[i0] + y[i1]) / 2;
                // Use color and trace_width from the first selected point (i0)
                const new_color = color ? color[i0] : undefined;
                const new_trace_width = trace_width ? trace_width[i0] : undefined;
                // Insert new point between the two selected indices (at higher index + 1)
                const insertAt = Math.max(i0, i1);
                x.splice(insertAt, 0, mx);
                y.splice(insertAt, 0, my);
                if (color) color.splice(insertAt, 0, new_color);
                if (trace_width) trace_width.splice(insertAt, 0, new_trace_width);
                pointsSource.data = {x: x, y: y, color: color, trace_width: trace_width};
                // Select only the new point
                pointsSource.selected.indices = [insertAt];
            }
        });
    }
    ''' % (points_source_id)
curdoc().js_on_event('document_ready', CustomJS(code=js_code))

button = Button(label="change line_width")
button.on_click(change_line_width)
curdoc().add_root(column(p, button))
curdoc().title = "Interactive Spline Trace"