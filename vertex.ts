import {Scatter, ScatterView} from "models/glyphs/scatter"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {catmullrom_spline} from "core/util/interpolation"
import type * as visuals from "core/visuals"

export class VertexView extends ScatterView {
  declare model: Vertex

  connect_signals(): void {
    super.connect_signals()
   // Set BokehJS listener this.connect(...) so that the program can process new data when the model changes.
  }
    protected _paint(ctx: Context2d, indices: number[], data?: Partial<Scatter.Data>): void {
        console.log("VertexView._paint() called")
        // Call the base class _paint method to draw the scatter points
        super._paint(ctx, indices, data)
        // sx and sy are arrays of x and y coordinates of the vertices in in screen space (pixels), 
        // calculated by BokehJS to position points on the canvas. 
        // The values are related to the ColumnDataSource data, but transformed to screen space.
        const {sx, sy} = {...this, ...data}
        // Draw splines through all vertices
        if (sx && sy && sx.length > 1 && sy.length > 1) {
            // Use the internal Catmull-Rom spline function - https://github.com/bokeh/bokeh/blob/0dcad2e96f1c089e2f36ff9066ed8123128ad1a0/bokehjs/src/lib/core/util/interpolation.ts#L5
            const [xt, yt] = catmullrom_spline(sx, sy, 10, 0.5, false)
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(xt[0], yt[0])
            for (let i = 1; i < xt.length; i++) {
                ctx.lineTo(xt[i], yt[i])
                // use special "Visual" classes for configuring the HTML context that will do the right thing, 
                // regardless of whether there is a single scalar value, or a vector of values
                // It provides accessors for vectorized visual properties (like line, fill, hatch) that correspond to glyph property definitions in your Python model (e.g., line_color, line_width, etc.).
                this.visuals.line.apply(ctx, i)
            }
            // renders the entire path
            ctx.stroke()
            // Restore the context to its previous state 
            // otherwise, the next drawing operation would be affected by the current state
            ctx.restore()
        }
    }
  render(): void {
    super.render()
  }
}

export namespace Vertex {
  export type Attrs = p.AttrsOf<Props>
  export type Visuals = Scatter.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
  export type Props = Scatter.Props & {
    // Add custom properties here if needed
  }
}

export interface Vertex extends Vertex.Attrs {}

export class Vertex extends Scatter {
  declare properties: Vertex.Props
  declare __view_type__: VertexView

  constructor(attrs?: Partial<Vertex.Attrs>) {
    super(attrs)
    console.log("Vertex constructor called")
  }

  static {
    this.prototype.default_view = VertexView
    // The this.define() block adds corresponding "properties" to the JS
    // model. These should normally line up 1-1 with the Python model
    // class. Most property types have counterparts. For example,
    // bokeh.core.properties.String will correspond to ``String`` in the
    // JS implementation. Where JS lacks a given type, you can use
    // ``p.Any`` as a "wildcard" property type.
    this.define<Vertex.Props>(({}) => ({
      // Define custom properties here if needed
    }))
  }
}
