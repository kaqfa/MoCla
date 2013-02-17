$( '#mainpage' ).live( 'pageinit',function(event){
    db.transaction(
    function(tx){tx.executeSql("select * from cl_cours", [], getCourse, exeError);}, 
    transError);
}); 

function getCourse(tx, results){
    $('#coursedata').append('<li><a href="course_view.html?course='+
        results.rows.item(0).code.toLowerCase()+'">'+
        results.rows.item(0).intitule+'</a></li>');
    $('#coursedata').listview('refresh');
}
		
$( '#coursedesc' ).live( 'pageinit',function(event){						
    var code = urlParam("course");
    db.transaction(
        function(tx){
            tx.executeSql("select * from c_"+code+"_course_description", 
                [], getDesc, exeError);
        }, 
        transError);
});
function getDesc(tx, results){
    var size = results.rows.length;
    var i;
    for(i = 0;i < size;i++){
        $('div[data-role=collapsible-set]')
        .append('<div data-role="collapsible"><h3>'+results.rows.item(i).title
            +'</h3><p>'+results.rows.item(i).content+'</p></div>');
    }
    $('div[data-role=collapsible]').collapsible();
}