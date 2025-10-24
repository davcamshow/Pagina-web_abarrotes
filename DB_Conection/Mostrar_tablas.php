<?php
include "Conexion_BD.php";
$consulta = "SHOW TABLES";
$resultado = mysqli_query($enlace, $consulta);
echo "<h2>Conexion exitosa '$baseDeDatos':</h2>";



echo "<table border='1' cellpadding='5'><tr><th>Nombre de la tabla</th></tr>";
while ($fila = mysqli_fetch_array($resultado)) {
	echo "<tr><td>" . $fila[0] . "</td></tr>";
}
echo "</table>";
?>