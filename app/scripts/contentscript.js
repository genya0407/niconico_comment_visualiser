'use strict';

import axios from 'axios'

class Analyse {
    constructor(video_id) {
        this.video_id = video_id
    }

    vposes() {
        axios.get('http://flapi.nicovideo.jp/api/getflv/' + this.vidoe_id)
             .then((response) => {
             })
    }
}

chrome.runtime.sendMessage({url: 'http://www.nicovideo.jp/', type: 'get_cookie'}, (cookie_string) => {
    console.log(cookie_string)
})
