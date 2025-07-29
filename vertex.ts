import {Scatter, ScatterView} from "models/glyphs/scatter"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
// import {catmullrom_spline} from "core/util/interpolation"

export class VertexView extends ScatterView {
  declare model: Vertex

  connect_signals(): void {
    super.connect_signals()
   // Set BokehJS listener this.connect(...) so that the program can process new data when the model changes.
  }
    protected _paint(ctx: Context2d, indices: number[], data?: Partial<Scatter.Data>): void {
        console.log("VertexView._paint() called")
        console.log(`Number of indices: ${indices.length}`)
        super._paint(ctx, indices, data)
        // Draw a polyline connecting all vertices
        const {sx, sy} = {...this, ...data}
        ctx.save()
        ctx.beginPath()
        let started = false;
        for (const i of indices) {
            const sx_i = sx[i]
            const sy_i = sy[i]
            //if (!isFinite(sx_i + sy_i)) continue
            if (!started) {
                ctx.moveTo(sx_i, sy_i)
                started = true
            } else {
                ctx.lineTo(sx_i, sy_i)
            }
        }
        ctx.strokeStyle = "black"; // Customize as needed
        ctx.lineWidth = 2;
        ctx.stroke()
        ctx.restore()
    }
  render(): void {
    super.render()
  }
}

export namespace Vertex {
  export type Attrs = p.AttrsOf<Props>

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
