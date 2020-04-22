const express = require("express");
const db = require("../../data/dbConfig.js")

const router = express.Router()

router.get("/", async (req, res, next) => {
    
    try {                              
            if(req.query.sortby && req.query.sortdir && req.query.limit) { 
                 // let sortby = `.orderBy("${req.query.sortby}", ${req.query.sortdir})`
                 //const accounts = await db.select("*").from("accounts")+sortby
                const accounts = await db.select("*").from("accounts").orderBy(req.query.sortby,req.query.sortdir).limit(req.query.limit)               
                res.json(accounts)                
            } else if(req.query.sortby && req.query.sortdir) { 
                const accounts = await db.select("*").from("accounts").orderBy(req.query.sortby,req.query.sortdir).limit(req.query.limit)               
                res.json(accounts)
            } else {
                const accounts = await db.select("*").from("accounts")             
                res.json(accounts)
            }                    
        
    } catch(error) {       
        next(err)
    }    

})

router.get("/:id", validateAccountID(), (req, res, next) => {   
    res.json(req.body.account)  
})

router.post("/", validateAccount(), isAccountNameUnique(), async (req, res, next) => {
    try {          
          const payload = {
              name: req.body.name,
              budget: req.body.budget
          }
          const [accountID] = await db("accounts").insert(payload)  // destructure Array
          const account = await db("accounts").where("id", accountID).first()
          res.status(201).json(account)
    } catch(err) {
          next(err)
    }
})


router.put("/:id", validateAccount(), validateAccountID(), isAccountNameUnique(), async (req, res, next) => {    
    try {
          const payload = {
               name: req.body.name,
               budget: req.body.budget
          }
          const  accountID= await db("accounts").update(payload).where("id", req.params.id)
          const  account= await db("accounts").where("id", req.params.id).first()
          res.json(account)

    } catch(err) {
          next(err)
    }
})

router.delete("/:id", validateAccountID(), async (req, res, next) => {
    try {
          await db("accounts").where("id", req.params.id).del()
          res.status(204).end()  // may be we can use 202 code as well we dont want to sent any message/response in this case
    } catch(err) {
          next(err)
    }
})

// Middleware
function validateAccountID() {
    return async (req, res, next) => {
        try {
              //const account = await db.select("*").from("accounts").where("id",req.params.id).limit(1) // it will return an array of object
              //const account = await db.select("*").from("accounts").where("id",req.params.id).first() // it will return a single object
              //const account = await db.from("accounts").where("id",req.params.id).first() // BY removing select * we will get same result 
              const account = await db("accounts").where("id", req.params.id).first()              
              if(account) {
                    req.body.account = account 
                    next()          
              } else {
                    res.status(404).json({message: "Invalid Account ID"})            
              }

        } catch (err) {
              next(err)
        }
        

    }
}


function validateAccount() {
    return async (req, res, next) => {

        if(req.body.constructor === Object && Object.keys(req.body).length ===0) {

                res.status(404).json({message: "missing account data"})

        } else if(!req.body.name || !req.body.budget) {

                res.status(404).json({message: "missing name or budget field"})

        } else {
               next()
        }        

    }
}


function isAccountNameUnique() {
    return async (req, res, next) => {
        try {  
              const accountID = req.params.id
              let account = '';
              if(accountID) {
                  account = await db("accounts").where("name", req.body.name).whereNot("id",accountID).first()  // in case of update

              } else {
                  account = await db("accounts").where("name", req.body.name).first()  // in case of insert

              }      
                          
              if(account) {
                  res.status(404).json({message: "Account Name alreday exist"})           
              } else {
                  next()          
              }

        } catch (err) {
              next(err)
        }
        

    }
}

module.exports = router