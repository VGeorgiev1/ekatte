SELECT l.ekatte as ekkate, l.type , l.name as localName, m.area,l.municipality, a.area_name areaName, m.municipality_name municipalityName FROM Localities as l
INNER JOIN Municipalities as m ON l.municipality = m.name
INNER JOIN Areas as a ON m.area = a.name
WHERE STRPOS(LOWER(l.name), $1) > 0;