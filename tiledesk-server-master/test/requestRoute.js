//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var User = require('../models/user');
var projectService = require('../services/projectService');
var requestService = require('../services/requestService');
var userService = require('../services/userService');
var leadService = require('../services/leadService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var winston = require('../config/winston');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('RequestRoute', () => {



  it('create', function (done) {
    // this.timeout(10000);

    var email = "test-request-create-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("request-create", savedUser._id).then(function(savedProject) {
     

          chai.request(server)
            .post('/'+ savedProject._id + '/requests/')
            .auth(email, pwd)
            .set('content-type', 'application/json')
            .send({"request_id":"request_id", "requester_id":"requester_id", "first_text":"first_text"})
            .end(function(err, res) {
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');
                
                res.body.should.have.property('request_id').eql('request_id');
                res.body.should.have.property('requester_id').eql('requester_id');
                res.body.should.have.property('first_text').eql('first_text');
                res.body.should.have.property('id_project').eql(savedProject._id.toString());
                res.body.should.have.property('createdBy').eql(savedUser._id.toString());
                res.body.should.have.property('messages_count').eql(0);
                res.body.should.have.property('status').eql(200);
                
                // res.body.should.have.property('agents').eql(savedUser._id);
                expect(res.body.agents.length).to.equal(1);
                expect(res.body.participants.length).to.equal(1);

                res.body.should.have.property('department').not.eql(null);
                res.body.should.have.property('lead').eql(null);
                            
          
               done();
            });
    });
  });
});


  it('getbyid', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("createWithId", savedUser._id).then(function(savedProject) {
      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
      // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
       requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
         

          chai.request(server)
            .get('/'+ savedProject._id + '/requests/'+savedRequest.request_id)
            .auth(email, pwd)
            .end(function(err, res) {
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');
                
                res.body.should.have.property('department').not.eql(null);
                res.body.should.have.property('lead').not.eql(null);
                            
          
               done();
            });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
    });
  });
});
    });
});




  it('getall', function (done) {
    // this.timeout(10000);

    var email = "test-signup-" + Date.now() + "@email.com";
    var pwd = "pwd";

    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
     projectService.create("createWithId", savedUser._id).then(function(savedProject) {
      leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
      // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
       requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
          winston.debug("resolve", savedRequest.toObject());
         

          chai.request(server)
            .get('/'+ savedProject._id + '/requests/')
            .auth(email, pwd)
            .end(function(err, res) {
                //console.log("res",  res);
                console.log("res.body",  res.body);
                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.requests[0].department).to.not.equal(null);
                expect(res.body.requests[0].lead).to.not.equal(null);
                expect(res.body.requests[0].lead.fullname).to.equal("leadfullname");
          
               done();
            });
            // .catch(function(err) {
            //     console.log("test reject", err);
            //     assert.isNotOk(err,'Promise error');
            //     done();
            // });
    });
  });
});
    });
});






it('getallcsv', function (done) {
  // this.timeout(10000);

  var email = "test-signup-" + Date.now() + "@email.com";
  var pwd = "pwd";

  userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
   projectService.create("createWithId", savedUser._id).then(function(savedProject) {
    leadService.createIfNotExists("leadfullname", "email@email.com", savedProject._id).then(function(createdLead) {
    // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status) {
     requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
        winston.debug("resolve", savedRequest.toObject());
       

        chai.request(server)
          .get('/'+ savedProject._id + '/requests/csv/')
          .auth(email, pwd)
          .end(function(err, res) {
              //console.log("res",  res);
              console.log("res.body",  res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
             
        
             done();
          });
          // .catch(function(err) {
          //     console.log("test reject", err);
          //     assert.isNotOk(err,'Promise error');
          //     done();
          // });
  });
});
});
  });
});





it('getallWithLoLead', function (done) {
  // this.timeout(10000);

  var email = "test-signup-" + Date.now() + "@email.com";
  var pwd = "pwd";

  userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
   projectService.create("createWithId", savedUser._id).then(function(savedProject) {
    leadService.createIfNotExists("request_id1-getallWithLoLead", "email@getallWithLoLead.com", savedProject._id).then(function(createdLead) {      
     requestService.createWithId("request_id1", createdLead._id, savedProject._id, "first_text").then(function(savedRequest) {
        winston.debug("resolve", savedRequest.toObject());
       

        chai.request(server)
          .get('/'+ savedProject._id + '/requests/')
          .auth(email, pwd)
          .end(function(err, res) {
              console.log("res",  res);
              console.log("res.body",  res.body);
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body.requests[0].department).to.not.equal(null);
              expect(res.body.requests[0].lead).to.not.equal(null);
        
             done();
          });
          // .catch(function(err) {
          //     console.log("test reject", err);
          //     assert.isNotOk(err,'Promise error');
          //     done();
          // });
  });
});
  });
});
});


  describe('/assign', () => {
 
   

    // it('assign', (done) => {

        
    // //   this.timeout();

    //    var email = "test-signup-" + Date.now() + "@email.com";
    //    var pwd = "pwd";

    //     userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //         projectService.create("test-join-member", savedUser._id).then(function(savedProject) {
    //             requestService.createWithId("join-member", "requester_id1", savedProject._id, "first_text").then(function(savedRequest) {

    //                 var webhookContent =     { "assignee": 'assignee-member'}
                        
            
    //                 chai.request(server)
    //                     .post('/'+ savedProject._id + '/requests/' + savedRequest.request_id + '/assign')
    //                     .auth(email, pwd)
    //                     .send(webhookContent)
    //                     .end((err, res) => {
    //                         //console.log("res",  res);
    //                         console.log("res.body",  res.body);
    //                         res.should.have.status(200);
    //                         res.body.should.be.a('object');
    //                         // res.body.should.have.property('status').eql(200);
                            

    //                         // res.body.should.have.property('participants').to.have.lengthOf(2);
    //                         // res.body.should.have.property('participants').contains("agentid1");
    //                         // res.body.should.have.property('participants').contains(savedUser._id);
                        
    //                         done();
    //                     });

                        
    //             });
    //             });
    //             });
    // }).timeout(20000);








});

});


