
var Department = require("../models/department");
var Project_user = require("../models/project_user");
var Group = require("../models/group");
var operatingHoursService = require("../models/operatingHoursService");
var mongoose = require('mongoose');
var winston = require('../config/winston');
const departmentEvent = require('../event/departmentEvent');
const Request = require('../models/request');


class DepartmentService {

  createDefault(project_id, createdBy) {
    return this.create('Default Department', project_id, 'assigned', createdBy, true);
  }

  create(name, id_project, routing, createdBy, isdefault) {

    if (!isdefault) {
      isdefault = false;
    }
    
    var that = this;
    return new Promise(function (resolve, reject) {
        var newDepartment = new Department({
          _id: new mongoose.Types.ObjectId(),
          // id_bot: 'undefined',
          routing: routing,
          name: name,
          id_project: id_project,
          default: isdefault,
          createdBy: createdBy,
          updatedBy: createdBy
        });
    
        return newDepartment.save(function (err, savedDepartment) {
          if (err) {
            winston.error('--- > ERROR ', err);
            reject(err);
          }
          winston.info('Default Department created', savedDepartment.toObject());
          return resolve(savedDepartment);
        });
      });
  }

  nextOperator (array, index) {
    winston.debug('array: ', array);
    winston.debug('index: ' + index);

    index = index || 0;
  
    if (array === undefined || array === null)
      array = [];
    else if (!Array.isArray(array))
      throw new Error('Expecting argument to RoundRound to be an Array');
  
    // return function () {
        index++;
      if (index >= array.length) index = 0;
      winston.debug('index: ' + index);
      return array[index];
    // };
}


roundRobin(operatorSelectedEvent) {

  var that = this;
 

  return new Promise(function (resolve, reject) {

    if (operatorSelectedEvent.department.routing !== 'assigned') {       
      winston.debug('It isnt an assigned request');  
      return resolve(operatorSelectedEvent);
    }

    
      // https://stackoverflow.com/questions/14789684/find-mongodb-records-where-array-field-is-not-empty
      let query = {id_project: operatorSelectedEvent.id_project, participants: { $exists: true, $ne: [] }};
      
      winston.debug('query', query);            

      // let lastRequests = await 
      Request.find(query).sort({_id:-1}).limit(1).exec(function (err, lastRequests) {
          if (err) {
              winston.error('Error getting request for RoundRobinOperator', err); 
              return reject(err);
          }
         
          
          winston.debug('lastRequests',lastRequests); 

          if (lastRequests.length==0) {
              winston.info('roundRobin lastRequest not found. fall back to random'); 
              //first request use default random algoritm
              // return 0;
              return resolve(operatorSelectedEvent);
          }

          // var start = Date.now();
          // var res = sleep(5000);
          // var end = Date.now();
          // // res is the actual time that we slept for
          // console.log(res + ' ~= ' + (end - start) + ' ~= 1000');


          let lastRequest = lastRequests[0];
          winston.debug('lastRequest:'+ JSON.stringify(lastRequest)); 

          let lastOperatorId = lastRequest.participants[0];
          winston.debug('lastOperatorId: ' + lastOperatorId);


          // BUGFIX (node:74274) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'id_user' of undefined
          //   at /Users/andrealeo/dev/chat21/tiledesk-server/services/requestService.js:55:56
          //   at processTicksAndRejections (internal/process/next_tick.js:81:5)
          // (node:74274) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)          
          if (operatorSelectedEvent.available_agents && operatorSelectedEvent.available_agents.length==0){
            winston.info('operatorSelectedEvent.available_agents empty ', operatorSelectedEvent.available_agents);
            return resolve(operatorSelectedEvent);
          }

          // https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
          let lastOperatorIndex = operatorSelectedEvent.available_agents.findIndex(projectUser => projectUser.id_user.toString() === lastOperatorId);

          // if lastOperatorIndex is -1(last operator is not available)->  that.nextOperator increment index +1 so it's work


  

          winston.debug('lastOperatorIndex: ' + lastOperatorIndex);

          let nextOperator = that.nextOperator(operatorSelectedEvent.available_agents, lastOperatorIndex);

          
          winston.info('roundRobin nextOperator: ' ,nextOperator.toJSON());
          
          


          // operatorSelectedEvent.operators = [{id_user: nextOperator.id_user}];
          operatorSelectedEvent.operators = [nextOperator];
          return resolve(operatorSelectedEvent);
      });
  
    });
}



getOperators(departmentid, projectid, nobot) {

  var that = this;
  return new Promise(function (resolve, reject) {
       // console.log("»»» »»» --> DEPT ID ", departmentid);

      let query;
      if (departmentid == 'default' || departmentid == undefined) {
        query = { default: true, id_project: projectid };
      } else {
        query = { _id: departmentid };
      }
       // console.log('query', query);
      return Department.findOne(query).exec(function (err, department) {
        // return Department.findOne(query).exec().then(function (department) {

        if (err) {
          winston.error('-- > 1 DEPT FIND BY ID ERR ', err)
          return reject(err);
        }
        // console.log("department", department);
        if (!department) {
          winston.error("Department not found for query ", query);
          return reject({ success: false, msg: 'Object not found.' });
        }
        // console.log('OPERATORS - »»» DETECTED ROUTING ', department.routing)
        // console.log('OPERATORS - »»» DEPARTMENT - ID BOT ', department.id_bot)

        // start code FOR DEBUG
        // NOTE: TO TEST '?nobot = true' see in the tiledesk dashboard: mongodb-department.service > testAssignesFunction
        if (nobot) {
          // console.log('nobot IS == true ? ', nobot)
          // console.log('»»»» »»»» nobot is == TRUE - JUMP TO ASSIGNED / POOLED ')
        } else if (!nobot) {
          // console.log('nobot IS != true ', nobot)
          if ((department.id_bot == null || department.id_bot == undefined)) {
            // console.log('»»»» »»»» BOT IS UNDEFINED or NULL and nobot is != TRUE - JUMP TO ASSIGNED / POOLED')
          } else {
            // console.log('»»»» »»»» BOT EXIST and nobot is != TRUE - ASSIGN THE SELECTED BOT ')
          }
        }
        // /.end code FOR DEBUG 

        // IF EXIST THE BOT AND nobot IS NOT UNDEFINED IN OPERATORS IS RETURNED THE ID OF THE BOT
        if ((department.id_bot != null || department.id_bot != undefined) && (!nobot)) {

          // if (department.id_group == null || department.id_group == undefined) {
          // MAKE X 'BOT' AS FOR 'ASSIGNED' AND 'POOLED': IF THERE IS A GROUP THE BOT WILL BE VISIBLE ONLY BY THE GROUP MEMBERS 
          // OTHERWISE THE BOT WILL BE VISIBLE TO ALL USERS (BECAUSE THERE IS NO GROUP)

          // console.log('OPERATORS - »»»» BOT IS DEFINED - !!! DEPT HAS NOT GROUP ID')
          // console.log('OPERATORS - »»»» BOT IS DEFINED -> ID BOT', department.id_bot);
          // console.log('OPERATORS - »»»» nobot ', nobot)

          return Project_user.find({ id_project: projectid }).exec(function (err, project_users) {
            if (err) {
              winston.error('-- > 2 DEPT FIND BY ID ERR ', err)
              return reject(err);
            }
            // console.log('OPERATORS - BOT IS DEFINED - MEMBERS ', project_users)
            // console.log('OPERATORS - BOT IS DEFINED - MEMBERS LENGHT ', project_users.length);

            // getAvailableOperatorsWithOperatingHours: IN BASE ALLE 'OPERATING HOURS' DEL PROGETTO ESEGUE 
            // getAvailableOperator CHE RITORNA I PROJECT USER DISPONIBILI
            return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {

              // console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", _available_agents);

              return resolve ({ department: department, available_agents: _available_agents, agents: project_users, operators: [{ id_user: 'bot_' + department.id_bot }] });
            }).catch(function (error) {

              // winston.error("Write failed: ", error);

              winston.error("Error D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", error);

              return reject(error);
            });
            
          });
        }

        else { // if (department.routing === 'assigned' || department.routing === 'pooled') {
          // console.log('OPERATORS - routing ', department.routing, ' - PRJCT-ID ', projectid)
          // console.log('OPERATORS - routing ', department.routing, ' - DEPT GROUP-ID ', department.id_group)


          /* ---------------------------------------------------------------------------------
          *  findProjectUsersAllAndAvailableWithOperatingHours return: 
          *  * available_agents (available project users considering personal availability in the range of the operating hours) 
          *  * agents (i.e., all the project users) 
          *  * operators (i.e. the id of a user selected random from the available project users considering personal availability in the range of the operating hours)
          * --------------------------------------------------------------------------------*/
          return that.findProjectUsersAllAndAvailableWithOperatingHours(projectid, department).then(function (value) {

            // console.log('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, '] ', value);
            value['department'] = department
            return resolve(value);

          }).catch(function (error) {
            winston.error('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ] -> ERROR: ', error);
            return reject(error);
          });
        }
      });
  });
};

 findProjectUsersAllAndAvailableWithOperatingHours(projectid, department) {
  var that = this;

  return new Promise(function (resolve, reject) {
    // console.log('D-1 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ], - ID GROUP', department.id_group);

    if (department.id_group != null) {

      return resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department));

    } else {

      return resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department));

    }

  });
};

 findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department) {
  var that = this;

  return new Promise(function (resolve, reject) {

    return Group.find({ _id: department.id_group }).exec(function (err, group) {
      if (err) {
        winston.error('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        return reject(err);
      }
      if (group) {
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> GROUP FOUND:: ', group);
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS LENGHT: ', group[0].members.length);
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS ID: ', group[0].members);

        // , user_available: true
        //Project_user.findAllProjectUsersByProjectIdWhoBelongsToMembersOfGroup(id_prject, group[0]);
        return Project_user.find({ id_project: projectid, id_user: group[0].members }).exec(function (err, project_users) {
          // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT ID ', projectid);
          if (err) {
            // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER - ERR ', err);
            return reject(err);
          }
          if (project_users && project_users.length > 0) {
            // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER (IN THE GROUP) LENGHT ', project_users.length);

            return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
              var _available_agents = _available_agents
              // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

              var selectedoperator = []
              if (department.routing === 'assigned') {                
                selectedoperator = that.getRandomAvailableOperator(_available_agents);
              }

              let objectToReturn = { available_agents: _available_agents, agents: project_users, operators: selectedoperator, department: department, group: group, id_project: projectid };
              departmentEvent.emit('operator.select', objectToReturn);

              that.roundRobin(objectToReturn).then(function(objectToReturnRoundRobin){
                return resolve(objectToReturnRoundRobin);
              });
              

            }).catch(function (error) {

              // winston.error("Write failed: ", error);
              winston.error('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_group ] - AVAILABLE AGENT - ERROR ', error);

              return reject(error);
              //sendError(error, res);
            });
           
          } else {
            return resolve({ available_agents: [], agents: [], operators: [] })
          }

        })
      }
    });
  });
}


 findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department) {

  var that = this;

  return new Promise(function (resolve, reject) {
    return Project_user.find({ id_project: projectid }).exec(function (err, project_users) {
      if (err) {
        winston.error('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        return reject(err);
      }
      // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS LENGHT ', project_users.length)
      // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS ', project_users)


      if (project_users && project_users.length > 0) {
        
        return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
          var _available_agents = _available_agents
          // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

          var selectedoperator = []
          if (department.routing === 'assigned') {
            selectedoperator = that.getRandomAvailableOperator(_available_agents);
          }

          let objectToReturn = { available_agents: _available_agents, agents: project_users, operators: selectedoperator, department: department, id_project: projectid };
          departmentEvent.emit('operator.select', objectToReturn);

          that.roundRobin(objectToReturn).then(function(objectToReturnRoundRobin){
            return resolve(objectToReturnRoundRobin);
          });
          
        }).catch(function (error) {

          // winston.error("Write failed: ", error);
          winston.error('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_nogroup ] - AVAILABLE AGENT - ERROR ', error);
          return reject(error);

        });

       
      } else {
        return resolve({ available_agents: [], agents: [], operators: [] })
      }

    });
  });
}



 getAvailableOperatorsWithOperatingHours(project_users, projectid) {

  var that = this;


  return new Promise(function (resolve, reject) {

    if (project_users && project_users.length > 0) {

      return operatingHoursService.projectIsOpenNow(projectid, function (isOpen, err) {
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> PROJECT ID: ', projectid);
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT: ', isOpen);
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT - ERROR: ', err)

        if (err) {
          winston.error(err); 
          return reject(err);
          // sendError(err, res);

        } 
        
        if (isOpen) {

          var _available_agents = that.getAvailableOperator(project_users);

          return resolve(_available_agents);
        } else {
          // console.logO ---> [ OHS ] -> PROJECT NOT FOUND("HERERERERERERE");
          return resolve([]);
        }
      });
    } else {
      return resolve([]);
    }

  });
}

// FILTER ALL THE PROJECT USERS FOR AVAILABLE = TRUE
 getAvailableOperator(project_users) {
  var project_users_available = project_users.filter(function (projectUser) {
    if (projectUser.user_available == true) {
      return true;
    }
  });
  // console.log('D -> [GET AVAILABLE PROJECT-USER ] - AVAILABLE PROJECT USERS (getAvailableOperator): ', project_users_available)
  return project_users_available
}



 


 getRandomAvailableOperator(project_users_available) {

  // console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE LENGHT ', project_users_available.length);
  if (project_users_available.length > 0) {
    var operator = project_users_available[Math.floor(Math.random() * project_users_available.length)];
    // console.log('OPERATORS - SELECTED MEMBER ID', operator.id_user);

    return [{ id_user: operator.id_user }];
    // return [operator];

  }
  else {

    return []

  }
}



}


var departmentService = new DepartmentService();


module.exports = departmentService;
