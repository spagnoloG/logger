import Rest from '../util/Rest';

const SignInService = {
    async login (credentials) {
        return await Rest.post('/user/login', credentials);
    }
}

export default SignInService;