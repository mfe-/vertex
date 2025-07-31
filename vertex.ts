import { Scatter, ScatterView } from "models/glyphs/scatter"
import * as p from "core/properties"
import type { Context2d } from "core/util/canvas"
// import {catmullrom_spline} from "core/util/interpolation"
import type * as visuals from "core/visuals"
// import * as color from "core/util/color"
import type {Arrayable} from "core/types"
import {infer_type} from "core/types"
import {assert} from "core/util/assert"

export class VertexView extends ScatterView {
  // Utility to get a vector property array from a scalar or vector property
  get_vector_property(prop: any): number[] {
    if (prop.is_scalar) {
      return Array(prop.length).fill(prop.value);
    } else {
      return prop.array;
    }
  }
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
    const { sx, sy } = { ...this, ...data }
    // Draw splines through all vertices
    if (sx && sy && sx.length > 1 && sy.length > 1) {
      // Retrieve tension from the model
      const tension = this.model.tension;
      // Use the internal Catmull-Rom spline function
      const [xt, yt, indices] = VertexView.catmullrom_spline(sx, sy, 10, tension, false)
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(xt[0], yt[0])
      const line_widths = this.get_vector_property((this.line_width as any));
      for (let i = 1; i < xt.length; i++) {
        ctx.beginPath();
        const idx = indices[i];
        ctx.lineWidth = line_widths[idx];
        console.log(`Segment ${i}: vertex index ${idx}, lineWidth ${line_widths[idx]}`);
        ctx.moveTo(xt[i - 1], yt[i - 1]);
        ctx.lineTo(xt[i], yt[i]);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  render(): void {
    super.render()
  }
  // The Catmull-Rom spline function based on https://github.com/bokeh/bokeh/blob/0dcad2e96f1c089e2f36ff9066ed8123128ad1a0/bokehjs/src/lib/core/util/interpolation.ts#L5
  // is used to create smooth curves through a set of points.
  // It takes arrays of x and y coordinates, a tension parameter, and a flag for closed curves.
  // This function retruns three arrays:
  // - xt: x coordinates of the spline points
  // - yt: y coordinates of the spline points
  // - indices: indices of the starting vertex for each segment
  static catmullrom_spline(x: Arrayable<number>, y: Arrayable<number>,
    T: number = 10, tension: number = 0.5, closed: boolean = false): [Arrayable<number>, Arrayable<number>, Arrayable<number>] {
    /** Centripetal Catmull-Rom spline. */
    assert(x.length == y.length)

    const n = x.length
    const N = closed ? n + 1 : n

    const ArrayType = infer_type(x, y)

    const xx = new ArrayType(N + 2)
    const yy = new ArrayType(N + 2)
    xx.set(x, 1)
    yy.set(y, 1)

    if (closed) {
      xx[0] = x[n - 1]
      yy[0] = y[n - 1]
      xx[N] = x[0]
      yy[N] = y[0]
      xx[N + 1] = x[1]
      yy[N + 1] = y[1]
    } else {
      xx[0] = x[0]
      yy[0] = y[0]
      xx[N + 1] = x[n - 1]
      yy[N + 1] = y[n - 1]
    }

    const basis = new ArrayType(4 * (T + 1))
    for (let j = 0, k = 0; j <= T; j++) {
      const t = j / T
      const t_2 = t ** 2
      const t_3 = t * t_2
      basis[k++] = 2 * t_3 - 3 * t_2 + 1 // h00
      basis[k++] = -2 * t_3 + 3 * t_2     // h01
      basis[k++] = t_3 - 2 * t_2 + t // h10
      basis[k++] = t_3 - t_2     // h11
    }

    const xt = new ArrayType((N - 1) * (T + 1))
    const yt = new ArrayType((N - 1) * (T + 1))
    const indices = new ArrayType((N - 1) * (T + 1))

    for (let i = 1, k = 0; i < N; i++) {
      const t0x = (xx[i + 1] - xx[i - 1]) * tension
      const t0y = (yy[i + 1] - yy[i - 1]) * tension
      const t1x = (xx[i + 2] - xx[i]) * tension
      const t1y = (yy[i + 2] - yy[i]) * tension

      for (let j = 0; j <= 4 * T; k++) {
        const h00 = basis[j++]
        const h01 = basis[j++]
        const h10 = basis[j++]
        const h11 = basis[j++]

        xt[k] = h00 * xx[i] + h01 * xx[i + 1] + h10 * t0x + h11 * t1x
        yt[k] = h00 * yy[i] + h01 * yy[i + 1] + h10 * t0y + h11 * t1y
        indices[k] = i - 1 // index of the starting vertex for this segment
      }
    }

    return [xt, yt, indices]
  }

}

export namespace Vertex {
  export type Attrs = p.AttrsOf<Props>
  export type Visuals = Scatter.Visuals & { line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector }
  export type Props = Scatter.Props & {
    // Add custom properties here if needed
     tension: p.Property<number>
  }
}

export interface Vertex extends Vertex.Attrs { }

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
    this.define<Vertex.Props>(({Float}) => ({
      // Define custom properties here if needed
      tension: [ Float, 0.5 ],

    }))
  }
}
