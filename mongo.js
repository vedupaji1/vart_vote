const mongo = require('mongoose')

const db_schema = mongo.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    password: String,
    vote_system: [{
        vote_system_name: String,
        vote_system_code: String,
        total_candidate: Number,
        vote_start_time: String,
        vote_end_time: String,
        meet_url:String,
        candidate_name: [],
        voters_mail:[],
        candidate_data: [{ name_candidate: String, votes: Number }]
    }]
})

module.exports = mongo.model('vote_data', db_schema);