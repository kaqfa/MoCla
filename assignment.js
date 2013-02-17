$( '#assignmentpage' ).live( 'pageinit',function(event){						
    var code = urlParam("course");
    db.transaction(
        function(tx){
            tx.executeSql("select * from c_"+code+"_wrk_assignment", 
                [], getAssignment, exeError);
        }, 
        transError);
});
function getAssignment(tx, results){			
    var size = results.rows.length;
    var i;
    for(i = 0;i < size;i++){
        $('ul[data-role=listview]').append('<li><a href="assignment_detail.html?course=tp109&id='+
            results.rows.item(i).id+'">'+results.rows.item(i).title+
            '<span class="ui-li-count">'+results.rows.item(i).end_date+'</span></a></li>');
    }
    $('ul[data-role=listview]').listview('refresh');
}
		
$( '#assignmentdetail' ).live( 'pageinit',function(event){						
    var course = urlParam("course");
    var id = urlParam("id");
    db.transaction(
        function(tx){
            tx.executeSql("select * from c_"+course+"_wrk_assignment where id = '"+id+"'", 
                [], getAssignment, exeError);
        }, 
        transError);
});
function getAssignmentDetail(tx, results){			
    $('div[data-role=header]').html('<h1>'+results.rows.item(0).title+'</h1>');
    $('#questionArea').html('<label>'+results.rows.item(0).description+'</label>');
    $('ul[data-role=listview]').listview('refresh');
}