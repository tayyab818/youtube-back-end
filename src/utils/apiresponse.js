class apiresponse{
constructor(statuscode,data,message="sucess"){
    this.statuscode=statuscode
    this.data=data
    this.sucess=statuscode < 400
    this.message=message
}
}



export default apiresponse