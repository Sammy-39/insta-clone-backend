const jwt = require("jsonwebtoken")

const secret = "sadfgs"

const createJWTToken = ({_id}) =>{
    return jwt.sign({_id},secret)
}

module.exports = createJWTToken