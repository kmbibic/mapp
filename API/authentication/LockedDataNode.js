var LockedSimplifyNode = function(res, nextCall) {
    let UnlockedSimplifyNode = () => {
        return {
            next: () => {
                nextCall()
            }
        }
    }

    let unlock = () => {
        return UnlockedSimplifyNode()
    }

    let accept = (visitor, credentials) => {
        // all users allowed to use this
        visitor.visitSimplifyNode(unlock())
    }

    return {
        accept: accept
    }
}

var LockedStepsNode = function(res, nextCall) {
    let UnlockedStepsNode = () => {
        return {
            next: () => {
                nextCall()
            }
        }
    }

    let unlock = () => {
        return UnlockedStepsNode()
    }

    let checkCredentials = (credentials) => {
        return credentials.premium == true
    }

    let accept = (visitor, credentials) => {
        // all users allowed to use this
        if (checkCredentials(credentials)) {
            visitor.visitSimplifiedNode(unlock())
        } else {
            visitor.visitUnauthorizeNode(self)
        }
    }

    let next = () => {
        res.status(401).json({
            message: "user not authorized to use this service"
        })
    }

    let self = {
        accept: accept,
        next: next 
    }

    return self
}

module.exports = {
    LockedSimplifyNode: LockedSimplifyNode,
    LockedStepsNode: LockedStepsNode
}