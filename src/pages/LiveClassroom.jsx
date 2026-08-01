import {
    Box,
    Typography,
    Paper
} from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";

export default function LiveClassroom(){

    return(

        <Box
            sx={{
                display:"flex",
                justifyContent:"center",
                alignItems:"center",
                minHeight:"80vh",
                p:4
            }}
        >

            <Paper
                elevation={0}
                sx={{
                    p:6,
                    borderRadius:4,
                    textAlign:"center",
                    backdropFilter:"blur(16px)",
                    background:"rgba(255,255,255,.55)"
                }}
            >

                <VideocamIcon
                    sx={{
                        fontSize:90,
                        color:"#3f51b5",
                        mb:2
                    }}
                />

                <Typography
                    variant="h4"
                    fontWeight={700}
                >
                    Impact Live Classroom
                </Typography>

                <Typography
                    sx={{
                        mt:2,
                        opacity:.7
                    }}
                >
                    Video conferencing module coming soon.
                </Typography>

            </Paper>

        </Box>

    );

}
