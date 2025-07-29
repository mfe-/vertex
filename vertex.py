from bokeh.core.properties import String, Instance
from bokeh.models import UIElement, Slider, Scatter

class Vertex(Scatter):

    __implementation__ = "vertex.ts"

    def __init__(self, color=None, marker=None, **kwargs):
        if marker is None:
            marker = 'circle'
        if color is None:
            color = 'blue'
        kwargs.setdefault('marker', marker)
        kwargs.setdefault('size', 8)
        kwargs.setdefault('fill_color', color)
        kwargs.setdefault('fill_alpha', 0.8)
        kwargs.setdefault('line_color', None)
        super().__init__(**kwargs)
