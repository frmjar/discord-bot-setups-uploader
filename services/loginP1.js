import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

global.fetch = fetch

const poolData = {
  UserPoolId: 'ca-central-1_VGoFypwpe',
  ClientId: '6mu7svlaa4q8i1mvkeknhsruo8'
}

const userPool = new CognitoUserPool(poolData)

const userData = {
  Username: 'elemaofrmjar@gmail.com',
  Pool: userPool
}

const cognitoUser = new CognitoUser(userData)

const authDetails = new AuthenticationDetails({
  Username: 'elemaofrmjar@gmail.com',
  Password: 'Hppavilionmx70%'
})

const login = async () => {
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        resolve({
          bearer: result.getAccessToken().getJwtToken(),
          userId: result.getAccessToken().payload.username
        })
      },
      onFailure: (err) => {
        reject(err)
      }
    })
  })
}

export {
  login
}

