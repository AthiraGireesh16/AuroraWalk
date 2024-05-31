module.exports = {
    userAuth : (req , res, next) =>{
        if(!req.session.user){
            return res.redirect('/')
        }
        next()
    },
    adminAuth : (req ,res , next) =>{
        if(!req.session.admin){
            return res.redirect('/adminlogin')
        }
        next()
    },
    userLoggedout : (req ,res ,next)=>{
        if(req.session.user){
            return res.redirect('/')
        }
        next()
    },
    adminLoggedout : (req ,res, next)=>{
        if(req.session.admin){
            return res.redirect('/admin')
        }
        next()
    }
}