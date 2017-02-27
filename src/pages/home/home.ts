import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

import * as d3 from 'd3';

export class Stylesheet {
  selectors: any = {};
  keyframes: any = {};

  constructor() {
  }

  setProperty(selector, property, value) {
    var styles = this.selectors[selector] || {};
    styles[property] = value;
    this.selectors[selector] = styles;
  }

  setKeyframe(name, content) {
    this.keyframes[name] = content;
  }

  render() {
    var output = '';

    // Concat styles
    var prop, props, style/*, css = []*/;
    for (var selector in this.selectors) {
      style = '';
      props = this.selectors[selector];
      for (prop in props) {
        style += prop + ':' + props[prop] + ';';
      }
      output += selector + '{' + style + '}';
    }

    // Concat keyframes
    for (var keyframe in this.keyframes) {
      output += '@keyframes ' + keyframe + '{' + this.keyframes[keyframe] + '}';
    }

    return output;
  }


}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  vboard: any = null;
  isPlaying: boolean = false;
  active: any = null;
  duration: number = 1;
  styleTag: any = null;
  timer: any = null;
  playColor: string = 'primary';
  id: any = 'abcdefgh';

  constructor(public navCtrl: NavController) {
  }

  ngAfterViewInit() {
    this.vboard = d3.select('#quill')
      .attr("viewBox", "0 0 500 500")
      .attr("xmlns", "http://www.w3.org/2000/svg")
    this.vboard.call(
      d3.drag()
        .container(function () { return this as any; })
        .subject(function () { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", () => {
          if (this.isPlaying) return;

          var line = d3.line()
            .curve(d3.curveBasis)

          var d = d3.event.subject
          this.active = this.vboard.append("path").style("fill", "none").style("stroke", "#000").datum(d)
          var x0 = d3.event.x
          var y0 = d3.event.y

          d3.event.on("drag", () => {
            // console.log('drag')
            var x1 = d3.event.x,
              y1 = d3.event.y,
              dx = x1 - x0,
              dy = y1 - y0;

            if (dx * dx + dy * dy > 50) {
              d.push([x0 = x1, y0 = y1]);
              // console.log('if')
            } else {
              d[d.length - 1] = [x1, y1];
              // console.log('else')
            }
            //console.log(active)
            this.active.attr("d", line);
          })

        })
        .on("end", () => { /* noop */ }))
  }

  clr() {
    this.vboard.selectAll("*").remove()
  }

  play() {
    if (false === this.isPlaying) {
      this.isPlaying = true
      this.playColor = 'danger';
      this.addStyle()
      this.timer = setTimeout(() => {
        this.isPlaying = false
        this.rmStyle()
      }, this.duration)
    } else {
      this.isPlaying = false
      this.playColor = 'primary';
      if (this.timer) {
        clearTimeout(this.timer)
      }
      this.rmStyle()
    }
  }

  save() {
      this.addStyle()
      const SVG_CONTENT_TYPE: any = 'image/svg+xml'
      const el = document.getElementById('quill')
      const blob = new Blob([el.outerHTML], {SVG_CONTENT_TYPE} as any)
      const url = window.URL.createObjectURL(blob)
      var downloadAnchor = document.createElement('a')
      //downloadAnchor.style = 'display: none';
      document.body.appendChild(downloadAnchor)
      downloadAnchor.href = url
      downloadAnchor.download = 'vboard' + '_' + this.id + '.svg'
      downloadAnchor.click()
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10)
      this.rmStyle()
  }

  addStyle() {
    this.id = this.generateKey(8);
    var paths = document.querySelectorAll('path')
    var map = []
    for (let i = 0; i < paths.length; ++i) {
      let path = paths[i];
      var pathObj: any = {
        el: path,
        length: Math.ceil(path.getTotalLength())
      }
      pathObj.strokeDasharray = pathObj.length + ' ' + (pathObj.length + 1 * 2)
      pathObj.strokeDashoffset = pathObj.length + 1
      pathObj.length += 1

      pathObj.class = this.id + '_' + map.length
      pathObj.el.classList.add(pathObj.class)

      map.push(pathObj)
    }

    var totalLength = map.reduce(function (e, f) { return e + f.length }, 0)
    totalLength = totalLength === 0 ? 1 : totalLength
    // var duration = 2000
    this.duration = totalLength * 5
    var lengthMeter = 0

    for (var i = 0; i < map.length; i++) {
      var pathObj = map[i]
      pathObj.startAt = lengthMeter / totalLength * this.duration
      pathObj.duration = pathObj.length / totalLength * this.duration
      lengthMeter += pathObj.length;
    }

    var anim;
    var pathTimingFunction = 'linear'
    var style = new Stylesheet()
    style.setKeyframe(this.id + '_draw', '100%{stroke-dashoffset:0;}')

    this.styleTag = document.createElement('style')

    for (var i = 0; i < map.length; i++) {
      var pathObj = map[i]
      style.setProperty('.' + pathObj.class, 'stroke-dasharray', pathObj.strokeDasharray)
      style.setProperty('.' + pathObj.class, 'stroke-dashoffset', pathObj.strokeDashoffset)

      anim = this.id + '_draw' +
        ' ' + (pathObj.duration >> 0) + 'ms' +
        ' ' + pathTimingFunction +
        ' ' + (pathObj.startAt >> 0) + 'ms' +
        ' forwards'

      style.setProperty('.' + pathObj.class, 'animation', anim)

    }

    this.styleTag.innerHTML = style.render()
    var el = document.getElementById('quill')
    console.log(el)
    el.appendChild(this.styleTag)
    console.log(paths);
  }

  rmStyle() {
    this.styleTag.remove()
  }

  generateKey(length) {
    var output = '',
      src = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqsrtuvwxyz',
      len = src.length;

    while (length > 0) {
      output += src[Math.floor(Math.random()*len)];
      length--;
    }
    return output;    
  }


}
