import Rest from '../util/Rest';

const SignInService = {
    login (credentials) {
        Rest.post('/user/login', credentials);
    }
}

export default SignInService;