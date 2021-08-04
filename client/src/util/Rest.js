import axios from 'axios';

const URL = 'http://192.168.122.171:8000'

const Rest = {
    post (appendix, data) {
        axios.post(URL + appendix, data).then( (response) => {
            console.log(response);
        }).catch((err) => {
            console.log(err);
        })
    }
}

export default Rest;