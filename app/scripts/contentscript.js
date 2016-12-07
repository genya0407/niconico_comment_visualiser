'use strict';

import axios from 'axios'
import colormap from 'colormap'

class Analyse {
    constructor(video_id) {
        this.video_id = video_id
    }

    vposes(callback) {
        axios.get('http://flapi.nicovideo.jp/api/getflv/' + this.video_id)
             .then((response) => {
                 const data_arr = response.data.split('&').map((row)=>{ return row.split('=') })
                 const thread_id = data_arr.find((row)=>{ return row[0] === 'thread_id'})[1]
                 const user_id = data_arr.find((row)=>{ return row[0] === 'user_id'})[1]

                 const xml = `<thread thread="${thread_id}" version="20090904" res_from='-1000' user_id='${user_id}' />`
                 axios.post('http://nmsg.nicovideo.jp/api', xml, { headers: { 'Content-Type': 'application/xml' }})
                      .then((response) => {
                          var parser = new DOMParser()
                          const chats = parser.parseFromString(response.data, 'text/xml')
                                              .getElementsByTagName('chat')
                          const vposes = Array.from(chats)
                                              .map((chat)=>{ return parseInt(chat.attributes.vpos.nodeValue) })
                                              .sort((a, b) => { return a - b })
                          callback(vposes)
                      })
             })
    }

    score(vp, t) {
      const sigma = (Math.max.apply(null, vp) - Math.min.apply(null, vp)) / 30
      return vp.map((ti) => {
        return 1.0/(Math.sqrt(2*Math.PI*sigma))*Math.exp(-Math.pow((ti-t),2)/(2*Math.pow(sigma,2)))
      }).reduce((prev, current) => {
        return prev + current
      })
    }

    stand_score(vposes) {
        const _scores = vposes.map((t) => {
            return [t, this.score(vposes, t)]
        })
        const _min_score = Math.min.apply(null, _scores.map((pt) => { return pt[1] }))
        const _max_score = Math.max.apply(null, _scores.map((pt) => { return pt[1] }))
        const _score_range = _max_score - _min_score
        const scores = _scores.map((sc) => {
            return [sc[0], (sc[1] - _min_score) / _score_range]
        })
        return scores
    }

    stand_time(_vposes, callback) {
        axios.get(`http:\/\/ext.nicovideo.jp/api/getthumbinfo/${this.video_id}`)
             .then((response) => {
                 var parser = new DOMParser()
                 var length_str = parser.parseFromString(response.data, 'text/xml')
                                        .getElementsByTagName('length')[0].textContent
                 var minutes = length_str.split(':')[0]
                 var seconds = length_str.split(':')[1]
                 var vpos_range = (parseInt(minutes) * 60 + parseInt(seconds)) * 100
                 var vposes = _vposes.map((pt)=>{
                    return [pt[0] / vpos_range, pt[1]]
                 })
                 callback(vposes)
             })
    }
}

var analyser = new Analyse(
        'sm' + window.location.href.match(/^http:\/\/www.nicovideo.jp\/watch\/sm(\d+)$/)[1]
        )
analyser.vposes((vposes)=>{
    var vposes = analyser.stand_score(vposes)
    analyser.stand_time(vposes, (vposes) => {
        var elem = document.createElement('canvas')
        elem.id = 'comment-frequency-visualiser'
        const seekbar = document.getElementsByClassName('SeekBar')[0]
                                .nextElementSibling
        const seekbarParent = seekbar.parentNode
        seekbarParent.insertBefore(elem, seekbar)

        var cv = document.getElementById('comment-frequency-visualiser')
        const cv_width = seekbar.offsetWidth
        cv.style = `padding-left: -5px; margin: 0px; height: 50px`
        // cv.style.width = `${cv_width}px`
        cv.style.width = `${624}px`
        var ctx = cv.getContext('2d')
        const cm = colormap({colormap: 'freesurface-red', nshades: 255, format: 'rgbaString'})

        vposes.forEach((_, index) => {
            ctx.beginPath();

            ctx.fillStyle = cm[Math.floor(vposes[index][1])]

            if (index === 0){
                ctx.fillRect(0, 0, vposes[index][0] * cv_width, 200);
            } else {
                ctx.fillRect(vposes[index - 1][0] * cv_width, 0, (vposes[index][0] - vposes[index - 1][0]) * cv_width, 200);
            }
        })
    })
})

