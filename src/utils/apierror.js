

class apierror extends Error{
    constructor(
        statuscode,
        message="some thing went wrong",
        errors=[],
        statck=""

    ){
  super(message)
  this.statuscode=statuscode
  this.data=null
  this.message=message
  this.sucess=false
  this.errors=errors
  if(statck){
    this.stack=statck
  }else{
    Error.captureStackTrace(this,this.constructor)
  }
    }
}
export{apierror}