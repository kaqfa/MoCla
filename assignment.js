var assignment = {};
var answer = {};

$( '#assignmentpage' ).live( 'pageinit',function(event){						
    var code = urlParam("course");
    db.transaction(
        function(tx){
            console.log("select * from cl_"+code+"_wrk_assignment");
            tx.executeSql("select * from cl_"+code+"_wrk_assignment", [], getAssignment, exeError);            
        }, 
        transError);
});
function getAssignment(tx, results){			
    var size = results.rows.length;
    var i;
    console.log(results.rows.item(0));
    for(i = 0;i < size;i++){
        $('ul[data-role=listview]').append('<li><a href="assignment_detail.html?course=en&id='+
            results.rows.item(i).id+'">'+results.rows.item(i).title+
            '<span class="ui-li-count">'+results.rows.item(i).end_date+'</span></a></li>');
    }
    $('ul[data-role=listview]').listview('refresh');
}
		
$( '#assignmentdetail' ).live( 'pageinit',function(event){						
    
    var course = urlParam("course");
    
    db.transaction(
        function(tx){
            var theSql = "select * from cl_"+urlParam("course")+"_wrk_assignment where id = '"+urlParam("id")+"'";
            console.log(theSql);
            tx.executeSql(theSql, [], 
                function(tx,results){
                    assignment.id = results.rows.item(0).id;
                    assignment.title = results.rows.item(0).title;
                    assignment.description = results.rows.item(0).description;
                }, exeError);            
            tx.executeSql("select * from cl_"+urlParam("course")+"_wrk_submission", // where assignment_id = ? and user_id = ?
                [], function(tx,results){ //assignment.id,userlogin.user_id
                    if(results.rows.length > 0){
                        console.log(results.rows.item(0));
                        answer.numAnswer = 1;
                        answer.title = results.rows.item(0).title;
                        answer.text = results.rows.item(0).submitted_text;
                    }
                }, exeError);
        }, 
        transError, getAssignmentDetail);
});

function getAssignmentDetail(){
    $('div[data-role=header] h1').html(assignment.title);
    $('#questionArea').append('<label>'+assignment.description+'</label>');
    $('#assignmentId').val(assignment.id);
    console.log(answer);
    if(answer.numAnswer > 0){
        $('#textTitle').html(answer.title);
        $('#textAuthor').html(userlogin.fullname);
        $('#textAnswer').html(answer.text);
        $('#buttonArea').hide();
    }
    $('ul[data-role=listview]').listview('refresh');   
}

function saveAnswer(){
  var course = urlParam("course");
  db.transaction(function(tx){
            tx.executeSql("insert into cl_"+course+"_wrk_submission values (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?)", 
                [
                    $('#assignmentId').val(),
                    null,
                    userlogin.user_id,
                    null,
                    $('#title').val(),
                    'VISIBLE',
                    curDate(),
                    curDate(),
                    $('#author').val(),
                    $('#answer').val(),
                    '',
                    null,null,null
                ], 
                function(tx,result){
                  console.log('berhasil submit');
                  $.mobile.changePage( "assignment.html");
                }, exeError);
            var theSql = "INSERT INTO sync_change_logs VALUES "+
                " (NULL, ?, 'cl_en_wrk_submission', 'id', ?, 'I',"+
                '\'{ "cols":["id","assignment_id","parent_id","user_id","group_id","title","visibility",'+
                '"creation_date","last_edit_date","authors","submitted_text",'+
                '"submitted_doc_path","private_feedback","original_id","score"], '+
                "\"vals\": ["+$('#assignmentId').val()+", "+$('#assignmentId').val()+", 0, "+
                userlogin.user_id+", "+'0, "'+$('#title').val()+'","VISIBLE","'+curDate()+'", "'+curDate()+
                '", "'+$('#author').val()+'", "'+$('#answer').val()+'", "", "", "", 0]}\',"-", ?,1)';
            console.log(theSql);
            tx.executeSql(theSql,
                [ curDate(), $('#assignmentId').val(), curDate() ], 
                null, exeError);
        }, transError);
}