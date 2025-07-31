from bokeh.core.properties import String, Instance,Float,List
from bokeh.models import UIElement, Slider, Scatter

class Vertex(Scatter):
    tension = Float(default=0.7, help="Tension for the spline interpolation")
    __implementation__ = "vertex.ts"
    def __init__(self, color=None, marker=None, **kwargs):
        if marker is None:
            marker = 'circle'
        kwargs.setdefault('marker', marker)
        kwargs.setdefault('size', 8)
        kwargs.setdefault('fill_alpha', 0.8)
        kwargs.setdefault('line_alpha', 0.8)
        super().__init__(**kwargs)
