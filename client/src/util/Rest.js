import axios from 'axios';

const URL = 'http://192.168.122.171:8000'

const Rest = {
    async post (appendix, data) {
        return await axios.post(URL + appendix, data)
    }
}

export default Rest;