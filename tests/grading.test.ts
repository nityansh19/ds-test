import test from "node:test";
import assert from "node:assert/strict";
import {gradeSubmission,hasExamExpired} from "../lib/grading";

const items = [
  {id:"python-1",answer_index:1,points:5},
  {id:"stats-1",answer_index:0,points:10},
  {id:"data-1",answer_index:3,points:5}
] as const;

test("perfect candidate receives all available points",()=>{
  const {score,clean}=gradeSubmission(items.map(q=>q.id),items,{
    "python-1":1,"stats-1":0,"data-1":3
  });
  assert.equal(score,20);
  assert.deepEqual({...clean},{"python-1":1,"stats-1":0,"data-1":3});
});

test("wrong and unanswered questions score zero",()=>{
  assert.equal(gradeSubmission(items.map(q=>q.id),items,{"python-1":0}).score,0);
  assert.equal(gradeSubmission(items.map(q=>q.id),items,{}).score,0);
});

test("partially correct answers receive partial credit",()=>{
  assert.equal(gradeSubmission(items.map(q=>q.id),items,{"stats-1":0}).score,10);
});

test("extra forged IDs are removed and never influence scores",()=>{
  const {score,clean}=gradeSubmission(["python-1"],items,{
    "python-1":1,"stats-1":0,"data-1":3,"forged":0
  });
  assert.equal(score,5);
  assert.deepEqual(Object.keys(clean),["python-1"]);
});

test("invalid answer formats do not count",()=>{
  const {score,clean}=gradeSubmission(items.map(q=>q.id),items,{
    "python-1":"1","stats-1":4,"data-1":3.5
  });
  assert.equal(score,0);
  assert.equal(Object.keys(clean).length,0);
});

test("non-object answers safely receive zero",()=>{
  for(const value of [null,undefined,"yes",[],3]){
    assert.equal(gradeSubmission(["python-1"],items,value).score,0);
  }
});

test("prototype pollution keys cannot be used as credited answers",()=>{
  const {score}=gradeSubmission(["python-1"],items,{
    "__proto__":1,"constructor":1,"python-1":1
  });
  assert.equal(score,5);
});

test("expired or malformed deadlines are rejected",()=>{
  const now=Date.UTC(2026,9,13,18,30,0);
  assert.equal(hasExamExpired(new Date(now-1).toISOString(),now),true);
  assert.equal(hasExamExpired(new Date(now).toISOString(),now),true);
  assert.equal(hasExamExpired(new Date(now+1).toISOString(),now),false);
  assert.equal(hasExamExpired("invalid",now),true);
});
