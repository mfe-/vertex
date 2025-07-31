from bokeh.core.properties import String, Instance,Float,List
from bokeh.models import UIElement, Slider, Scatter

class Vertex(Scatter):
    tension = Float(default=0.7, help="Tension for the spline interpolation")
    # trace_width = List(Float, help="trace_width")
    __implementation__ = "vertex.ts"
    def __init__(self, color=None, marker=None, trace_width=None, **kwargs):
        if marker is None:
            marker = 'circle'
        if color is None:
            color = 'blue'
        # if trace_width is None:
        #     trace_width = 2
        kwargs.setdefault('marker', marker)
        kwargs.setdefault('size', 8)
        kwargs.setdefault('fill_color', color)
        kwargs.setdefault('fill_alpha', 0.8)
        kwargs.setdefault('line_color', color)
        # kwargs.setdefault('trace_width', trace_width)
        kwargs.setdefault('line_alpha', 0.8)
        super().__init__(**kwargs)
