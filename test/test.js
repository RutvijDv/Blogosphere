const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app");
var mongoose = require("mongoose");
const { expect } = require("chai");

//Assertion Style
chai.should();

var Access_Token = "";

chai.use(chaiHttp);

describe("new user created, logged in and is able to view all blogs and other CRUD operations", function () {
  it("A new user is created and logged in", function (done) {
    chai
      .request(server)
      //Register
      .post("/signup")
      .send({
        username: "User1@gmail.com",
        password: "User1@API",
      })
      .end(function (err, res) {
        //Register Check
        res.should.have.status(200);

        //Login
        chai
          .request(server)
          .post("/login")
          .send({
            username: "User1@gmail.com",
            password: "User1@API",
          })
          .end(function (err, res) {
            //Login Check
            res.should.have.status(200);
            res.body.should.have.property("token");
            Access_Token = res.body.token;
            done();
          });
      });
  });

  it("Allow logged user to view Blogs", function (done) {
    chai
      .request(server)
      //Retrieve All Blogs
      .get("/articles")
      .set({ authorization: "Bearer " + Access_Token })
      .end(function (err, res) {
        res.should.have.status(200);
        expect(res.body).to.be.a("array");
        done();
      });
  });
});
