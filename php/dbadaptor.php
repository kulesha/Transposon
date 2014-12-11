<?php

class DBAdaptor extends mysqli {
    private $host = 'localhost';
    private $port = 3306;
    private $user = 'root';
    private $pass = 'piglet';
    private $dbname ='genescripts';

    public function __construct() {
	   parent::__construct($this->host, $this->user, $this->pass, $this->dbname);
        $this->set_charset("utf8");
    }

	public function getAllSpecies() {
        $species = array();
		$sql = "SELECT * FROM species ORDER BY label";

 		if ($result = $this->query($sql, MYSQLI_USE_RESULT)) {
    	   while($obj = $result->fetch_object()){
                $opts =  json_decode(json_encode($obj), true);
	      	    $item = new Species( $opts );
  	             array_push($species, $item);
  	       } 
  	       mysqli_free_result($result);
  		}  
		return $species;
    }
    
    public function fetchGeneByName($name) {
        $sql = "SELECT * FROM genes WHERE name = '$name'";
        $obj = null;
        if ($result = $this->query($sql, MYSQLI_USE_RESULT)) {
    	   $obj = $result->fetch_object();
           mysqli_free_result($result);
  		}  
        
        $sql2 = "SELECT * from exons WHERE transcript_id = '".$obj->transcript_id."'";
        if ($result2 = $this->query($sql2, MYSQLI_USE_RESULT)) {
            $obj->exons = array();
    	   while($obj2 = $result2->fetch_object()){
  	         array_push($obj->exons, $obj2);
  	       } 
  	       mysqli_free_result($result2);
  		} 
		return $obj;
    }
}

?>